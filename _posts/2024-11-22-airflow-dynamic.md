---
layout: post
title: Stop Creating Multiple Airflow DAGs for Reloads and Parallel Processing
description: Modern Airflow and Dynamic Task Mapping to Transform Messy DAG Collections into Clean Solutions
date: 2024-11-04 09:00:00 +0300
image: '/images/blog/2024-11-22.jpg'
tags: [data engineering, airflow, python, dynamic task mapping, taskflow api]
toc: true
---

In this article, we'll tackle a common challenge in Airflow development: the proliferation of nearly identical DAGs for handling different data processing scenarios, especially those involving partitioned tables and historical reloads. You'll learn how to build a single, flexible DAG that leverages Dynamic Task Mapping to process partitions in parallel, handling both daily operations and custom date range reloads with ease.

![Dynamic Task Mapping demo]({{site.baseurl}}/images/blog/2024-11-22-09.gif)
*Dynamic Task Mapping demo, source: by author*

# The DAG Proliferation Nightmare

A recent Reddit thread posed a common data engineering challenge: "[How to Leverage Data Partitions for Parallelizing ETL Workflows in Airflow?](https://www.reddit.com/r/dataengineering/comments/1ghdhtb/how_to_leverage_data_partitions_for_parallelizing/){:target="_blank"}" The user, like many of us, wanted to process partitioned data in parallel for increased efficiency. This sparks a crucial question: How can we achieve true parallel processing while maintaining a clean and manageable codebase?

![How to Leverage Data Partitions for Parallelizing ETL Workflows in Airflow?]({{site.baseurl}}/images/blog/2024-11-22-01.png)
*Data Engineering Reddit, source: [Reddit](https://www.reddit.com/r/dataengineering/comments/1ghdhtb/how_to_leverage_data_partitions_for_parallelizing/){:target="_blank"}*

Partitioned tables are common in data warehousing. Partitions divide a table into smaller physical segments. This segmentation improves query performance. We define partitions by specifying one or more partition columns. Apache Hive, for example, supports multiple partition columns. BigQuery, on the other hand, supports only one. Here are two examples:

{% highlight sql %}
-- Hive (multiple partition columns)
CREATE TABLE some_schema.some_partitioned_table (
  user_id INT,
  event_name STRING,
  created_at TIMESTAMP
)
PARTITIONED BY (country STRING, day STRING)
STORED AS PARQUET;


-- BigQuery (single partition column)
CREATE TABLE some_dataset.some_partitioned_table (
  user_id INT64,
  country STRING,
  event_name STRING,
  created_at TIMESTAMP,
  day DATE
)
PARTITION BY day;
{% endhighlight %}

While partitioning improves query performance, it also presents an opportunity: parallel write operations. The Reddit user's question highlights this opportunity within Airflow. How can Airflow leverage table partitions for parallel processing?

Airflow offers `catchup` and `backfill` features for processing historical data. Catchup automatically creates Directed Acyclic Graph (DAG) runs for past schedules. Backfill allows users to manually trigger DAG runs for a specified date range.

{% highlight sh %}
airflow dags backfill \
    --start-date START_DATE \
    --end-date END_DATE \
    dag_id
{% endhighlight %}

You can combine these features with `max_active_runs` to parallelize historical loads. These built-in tools offer convenient features, like clear separation of runs in the Airflow User Interface (UI). However, they also come with drawbacks:

- Overhead of creating many DAG runs.
- Difficulty in managing backfills as a single operation.
- Limited customization.

The biggest limitation? These features lack flexibility for complex partitioning schemes. For instance, how can we efficiently parallelize across both date *and* country?

This limitation frequently leads to an Airflow anti-pattern: copy-pasted DAGs for different processing scenarios. Let's explore an example:

{% highlight py %}
{% raw %}
# daily_process.py
@dag(schedule="@daily")
def process_daily_partition():
    @task
    def process():
        # Single day, all countries
        date = '{{ yesterday_ds }}'
        for country in get_countries():
            process_partition(date=date, country=country)

# historical_reload.py
@dag(schedule=None)
def reprocess_date_range():
    @task
    def process():
        start_date = '{{ params.start_date }}'
        end_date = '{{ params.end_date }}'
        countries = '{{ params.countries }}'.split(',')

        # Nested loops - even worse!
        current = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')

        while current <= end:
            for country in countries:
                # Sequential processing of date-country combinations
                process_partition(
                    date=current.strftime('%Y-%m-%d'),
                    country=country
                )
            current += timedelta(days=1)

# country_specific_reload.py
@dag(schedule=None)
def reload_single_country():
    @task
    def process():
        country = '{{ params.country }}'
        # Another sequential loop, different parameter
        for date in get_all_historical_dates():
            process_partition(date=date, country=country)
{% endraw %}
{% endhighlight %}

This proliferation of DAGs leads to two major problems:
1. Code duplication across multiple DAGs.
2. Sequential processing of partitions when parallel execution is possible.

Consequences?  Consider these maintenance nightmares:
- Bug fixes require updates across multiple DAGs.
- Adding error handling or logging necessitates changes in multiple places.
- New DAGs often replicate existing logic unnecessarily.
- Tests become longer and more complex.
- Code reviews devolve into tedious comparisons.

> **Code Smell Alert**:
> Do you see multiple DAGs with nearly identical processing logic? Do these DAGs vary primarily by schedule or parameters? It's time for modernization!

What we *really* need is:
- One source of truth for processing logic
- Flexible execution modes (daily, historical, custom ranges)
- Efficient parallel processing of partitions
- Clean parameter handling
- Maintainable codebase

Dynamic Task Mapping in modern Airflow delivers this solution. Let's see how.

# Enter Dynamic Task Mapping

Dynamic Task Mapping in Airflow offers a powerful way to create tasks dynamically at runtime. This dynamic creation allows your data pipelines to adapt to varying data volumes and processing needs. Unlike manually defining tasks for each partition or scenario, Dynamic Task Mapping generates tasks based on the output of an upstream task. Think of it as a "for loop" orchestrated by the scheduler, where each iteration becomes a separate task instance.

When Airflow encounters a mapped task, it dynamically generates multiple task instances. These instances are then eligible for parallel execution, depending on available worker slots and your configured concurrency settings.

Here's how these settings interact:

- Global Parallelism: Airflow's `parallelism`setting defines the absolute upper limit.
- DAG Concurrency: A DAG's `concurrency` setting limits parallel tasks within that DAG.
- Task-Level Concurrency: `max_active_tis_per_dag` further restricts parallelism for a specific task across all DAG runs.
- Pools: Pools allow you to allocate resources to specific tasks or DAGs, influencing parallel execution.
- Available Worker Slots: Ultimately, the number of available worker slots determines how many task instances can truly run in parallel.

## Simple Mapping

In its simplest form, Dynamic Task Mapping iterates over a list or dictionary defined directly in your DAG. The `expand()` function is key here. It replaces the typical direct task call and dynamically generates task instances for each item in the iterable.

{% highlight py %}
{% raw %}
@task
def process_item(item):
    print(f"Processing: {item}")

items = ["apple", "banana", "cherry"]
process_item.expand(item=items)
{% endraw %}
{% endhighlight %}

## Task-Generated Mapping

The real power of Dynamic Task Mapping shines when an upstream task generates the list of items. This pattern enables your DAG to adapt to changing data:

{% highlight py %}
{% raw %}
@task
def generate_items():
    return ["dynamic_apple", "dynamic_banana"]

@task
def process_item(item):
    print(f"Processing: {item}")

items = generate_items()
process_item.expand(item=items)
{% endraw %}
{% endhighlight %}

## Parameters that Don't Expand

Often, you'll need to pass constant parameters alongside your dynamic inputs. The `partial()` function complements `expand()`, allowing you to define constant values for specific parameters:

{% highlight py %}
{% raw %}
@task
def process_item(item, connection_id):
    print(f"Processing: {item} with {connection_id}")

items = ["data1", "data2"]
process_item.partial(connection_id="my_database").expand(item=items)
{% endraw %}
{% endhighlight %}

This example efficiently passes the same `connection_id` to all dynamically generated `process_item` tasks. This shared parameter prevents unnecessary repetition and improves readability.

For scenarios involving multiple dimensions (like our date and country example), you can expand over multiple parameters simultaneously:

{% highlight py %}
{% raw %}
@task
def process_partition(date, country):
    print(f"Processing partition: {date}, {country}")

dates = ["2024-11-20", "2024-11-21"]
countries = ["US", "CA"]
process_partition.expand(date=dates, country=countries)
{% endraw %}
{% endhighlight %}

Here's a concise "Key Learnings" list for the "Enter Dynamic Task Mapping" chapter:

## Key Learnings

* **Dynamic Task Generation:**  Airflow creates task instances at runtime based on the output of an upstream task, enabling flexible and data-driven workflows.
* **`expand()` for Mapping:** Use the `expand()` function to iterate over lists or dictionaries, generating multiple task instances dynamically.
* **`partial()` for Constants:**  Pass constant parameters to your mapped tasks using `partial()`, avoiding code duplication and improving readability.
* **Multi-Parameter Mapping:** Expand over multiple parameters simultaneously to create a "cross product" of task instances, addressing complex partitioning scenarios.
* **Parallel Execution:** Dynamically mapped tasks run in parallel, maximizing efficiency and reducing processing time.  Airflow's `parallelism`, DAG `concurrency`, task `max_active_tis_per_dag`, and Pools allow fine-grained control over concurrent execution.
* **Empty Input Handling:** Airflow automatically skips mapped tasks with zero-length input, preventing unnecessary execution and potential errors.

With the DAG proliferation nightmare and Dynamic Task Mapping in mind, let's see how to apply this in a real-world scenario combined with some other modern Airflow features.

# Building a Modern Airflow Solution (Star Guest: DuckDB)

This example demonstrates how modern Airflow features, especially Dynamic Task Mapping, address the Reddit user's question: "[How to Leverage Data Partitions for Parallelizing ETL Workflows in Airflow?](https://www.reddit.com/r/dataengineering/comments/1ghdhtb/how_to_leverage_data_partitions_for_parallelizing/){:target="_blank"}" Our goal? A single, efficient DAG that handles both daily operations and custom date range reloads.

## Base Case

**Tech stack:**
* Airflow 2.10
* Python 3.12
* Airflow running in [Astro Runtime](https://www.astronomer.io/docs/astro/runtime-release-notes){:target="_blank"} using [Astro CLI](https://www.astronomer.io/docs/astro/cli/release-notes/){:target="_blank"}

We'll use [DuckDB](https://duckdb.org/){:target="_blank"} to write partitioned [Parquet files](https://parquet.apache.org/){:target="_blank"}, simulating a typical data partitioning scenario. The data is partitioned by day. Our DAG will implement two modes:
1. **Daily Mode:** Processes a single day's partition (regular scheduling scenario).
2. **Custom Mode:** Reprocesses a specified date range in parallel using Dynamic Task Mapping.

In addition to Dynamic Task Mapping, the example showcases these modern Airflow features:
* [TaskFlow API](https://airflow.apache.org/docs/apache-airflow/stable/tutorial/taskflow.html){:target="_blank"}.
* DAG parameters
* Python Virtual Environment Operator

You can quickly set up a local Airflow environment using the Astro CLI:

{% highlight sh %}
mkdir airflow-dynamic-task-mapping
astro dev init
astro dev start
{% endhighlight %}

![astro dev init]({{site.baseurl}}/images/blog/2024-11-22-02.png)
*Initialize local environment, source: by author*

![astro dev start]({{site.baseurl}}/images/blog/2024-11-22-03.png)
*Start local environment, source: by author*

![Airflow UI]({{site.baseurl}}/images/blog/2024-11-22-04.png)
*Local Airflow UI, source: by author*

## Setup Parameterized DAG

First, we'll create a parameterized DAG. We define the following parameters:

* `mode`:  Determines whether to process a single day (`daily`) or a custom range (`custom`). Defaults to `daily`.
* `start_date`, `end_date`: Define the date range for custom reloads.
* `events_per_partition`: Specifies the number of random data rows generated per partition.

{% highlight py %}
{% raw %}
from datetime import datetime, timedelta
from typing import List, Any

from airflow.decorators import dag, task
from airflow.models.param import Param


@dag(
    schedule=None,  # no start_date needed when schedule is set to None
    dag_display_name='🚀 Dynamic Task Mapping Demo 💚',
    params={
        'mode': Param(
            default='daily',
            enum=['daily', 'custom'],
            description='Execution mode'
        ),
        'start_date': Param(
            default='2024-01-01',
            format='date',
            description='Start date for the date range (only for custom)'
        ),
        'end_date': Param(
            default='2024-01-03',
            format='date',
            description='End date for the date range (only for custom)'
        ),
        'events_per_partition': Param(
            default=10,
            type='integer',
            description='Random events per partition'
        )
    }
)
def dynamic_task_mapping_demo():
    pass


dynamic_task_mapping_demo()
{% endraw %}
{% endhighlight %}

With this, we already learn about three modern Airflow features:

* If `schedule` is set to `None`, the `start_date` for a DAG is **not required**.
* With the `dag_display_name` attribute, we can set a custom name which is displayed in the Airflow UI instead of the DAG ID (supports emojis 😉).
* With `params` we can define DAG parameters, which are nicely rendered in the Airflow UI when triggering a DAG.

![Parameterized DAG]({{site.baseurl}}/images/blog/2024-11-22-05.png)
*Parameterized DAG, source: by author*

## Task-Generated Dates

For this scenario, we use an upstream task to generate the list of partitions based on the given start and end date.

{% highlight py %}
{% raw %}
@task(task_display_name='📆 Generate Dates')
    def get_date_range(
        start_date: str,
        end_date: str,
        params: dict[str, Any],
        ds: str
    ) -> List[str]:
        """
        You can access Airflow context variables by adding them as keyword arguments,
        like params and ds
        """
        if params['mode'] == 'daily':
            return [ds]

        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')

        return [
            (start + timedelta(days=i)).strftime('%Y-%m-%d')
            for i in range((end - start).days + 1)
        ]
{% endraw %}
{% endhighlight %}

This task highlights two more modern features:

* With the `task_display_name` attribute, we can set a custom name which is displayed in the Airflow UI instead of the Task ID (again: supports emojis 😱).
* Instead of interacting with the context directly, you can simply add any Airflow context variable as keyword arguments, like `params` or `ds`. Airflow will automagically inject these. See [Airflow template references](https://airflow.apache.org/docs/apache-airflow/stable/templates-ref.html){:target="_blank"} for variables that can be injected.

## DuckDB in Python Virtual Environment Operator

For writing data to partitions, we'll use DuckDB since it allows to write partitioned Parquet files. The task generates random data for each partition, controlled by the `events_per_partition` parameter.

To showcase another modern Airflow feature, we'll use a decorated task and let it run in a Python virtual environment. This allows to encapsulate additional dependencies, just like DuckDB, and keep the Airflow environment itself clean.

{% highlight py %}
{% raw %}
    @task.virtualenv(
        task_display_name='🔥 Process Partitions',
        requirements=['duckdb>=0.9.0'],
        python_version='3.12',
        map_index_template='{{ "Partition: " ~ task.op_kwargs["date_str"] }}'
    )
    def process_partition(date_str: str, events_per_partition: int):
        import duckdb

        # write sample data for this partition
        with duckdb.connect(':memory:') as conn:
            conn.execute(f"""
                COPY (
                    SELECT
                        strftime(DATE '{date_str}', '%Y-%m-%d') AS event_date,
                        (random() * 1000)::INTEGER AS some_value
                    FROM range({events_per_partition})
                ) TO 'out' (
                    FORMAT PARQUET,
                    PARTITION_BY (event_date),
                    OVERWRITE_OR_IGNORE
                )
            """)
{% endraw %}
{% endhighlight %}

This example demonstrates:

* With the `@task.virtualenv` decorator, the task is executed within a customizable Python virtual environment.
* Requirements will be installed automatically based on the `requirements` attribute.
* A custom Python version can be set via `python_version`.
* For tasks which are executed via Dynamic Task Mapping, `map_index_template` can be used to set a custom name for each individual task. This allows us to identify which partition was calculated by which task in the Airflow UI.
* With `COPY (...) TO (...)` DuckDB allows to write data to output files, supporting partitioned writes and the Parquet file format (among others).

Want to learn more about DuckDB? Feel free to read my article [Gotta process 'em all - DuckDB masters your data like a Pokémon trainer](https://vojay.de/2024/03/18/duckdb-pokemon/){:target="_blank"}.

## Putting it Together: Dynamic Task Mapping

With the tasks prepared, we can setup the Dynamic Task Mapping in our DAG. The goal is to have a task per partition, each calculating a different date. For this purpose, we use the `.expand()` function. The number of random rows / events per partition remains the same for each task, consequently we use `.partial()` to set this attribute.

{% highlight py %}
{% raw %}
    dates = get_date_range(
        start_date='{{ params.start_date }}',
        end_date='{{ params.end_date }}'
    )

    # partial: same for all task instances
    # expand: different for each instance (list of values, one for each instance)
    process_partition.partial(
        events_per_partition='{{ params.events_per_partition }}'
    ).expand(
        date_str=dates
    )
{% endraw %}
{% endhighlight %}

If we now run the DAG in custom mode with a date range of 3 days for example, we can see the Dynamic Task Mapping in the Airflow UI, showing the number of parallel tasks in square brackets.

![Dynamic Task Mapping demo]({{site.baseurl}}/images/blog/2024-11-22-06.png)
*Dynamic Task Mapping demo, source: by author*

By selecting the task and navigating to _Mapped Tasks_ we can see a list of task instances. Since we used a custom `map_index_template`, we can easily see which task calculated which partition. That way, you can also access the individual logs.

![Dynamic Task Mapping task list]({{site.baseurl}}/images/blog/2024-11-22-07.png)
*Dynamic Task Mapping task list, source: by author*

Finally, let's check the output of our DAG run.

![Dynamic Task Mapping output]({{site.baseurl}}/images/blog/2024-11-22-08.png)
*Dynamic Task Mapping output, source: by author*

And with that we answered the initial question: "[How to Leverage Data Partitions for Parallelizing ETL Workflows in Airflow?](https://www.reddit.com/r/dataengineering/comments/1ghdhtb/how_to_leverage_data_partitions_for_parallelizing/){:target="_blank"}" by using Dynamic Task Mapping.

For reference, here is the full DAG:

{% highlight py %}
{% raw %}
from datetime import datetime, timedelta
from typing import List, Any

from airflow.decorators import dag, task
from airflow.models.param import Param


@dag(
    schedule=None,  # no start_date needed when schedule is set to None
    dag_display_name='🚀 Dynamic Task Mapping Demo 💚',
    params={
        'mode': Param(
            default='daily',
            enum=['daily', 'custom'],
            description='Execution mode'
        ),
        'start_date': Param(
            default='2024-01-01',
            format='date',
            description='Start date for the date range (only for custom)'
        ),
        'end_date': Param(
            default='2024-01-03',
            format='date',
            description='End date for the date range (only for custom)'
        ),
        'events_per_partition': Param(
            default=10,
            type='integer',
            description='Random events per partition'
        )
    }
)
def dynamic_task_mapping_demo():
    @task(task_display_name='📆 Generate Dates')
    def get_date_range(
            start_date: str,
            end_date: str,
            params: dict[str, Any],
            ds: str
    ) -> List[str]:
        """
        You can access Airflow context variables by adding them as keyword arguments,
        like params and ds
        """
        if params['mode'] == 'daily':
            return [ds]

        start = datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.strptime(end_date, '%Y-%m-%d')

        return [
            (start + timedelta(days=i)).strftime('%Y-%m-%d')
            for i in range((end - start).days + 1)
        ]

    @task.virtualenv(
        task_display_name='🔥 Process Partitions',
        requirements=['duckdb>=0.9.0'],
        python_version='3.12',
        map_index_template='{{ "Partition: " ~ task.op_kwargs["date_str"] }}'
    )
    def process_partition(date_str: str, events_per_partition: int):
        import duckdb

        # write sample data for this partition
        with duckdb.connect(':memory:') as conn:
            conn.execute(f"""
                COPY (
                    SELECT
                        strftime(DATE '{date_str}', '%Y-%m-%d') AS event_date,
                        (random() * 1000)::INTEGER AS some_value
                    FROM range({events_per_partition})
                ) TO 'out' (
                    FORMAT PARQUET,
                    PARTITION_BY (event_date),
                    OVERWRITE_OR_IGNORE
                )
            """)

    dates = get_date_range(
        start_date='{{ params.start_date }}',
        end_date='{{ params.end_date }}'
    )

    # partial: same for all task instances
    # expand: different for each instance (list of values, one for each instance)
    process_partition.partial(
        events_per_partition='{{ params.events_per_partition }}'
    ).expand(
        date_str=dates
    )

dynamic_task_mapping_demo()
{% endraw %}
{% endhighlight %}

# Conclusion: The Path Forward

Let's recap the key takeaways from our journey into Dynamic Task Mapping:

* **Catchup and Backfill:** `catchup` and `backfill` can be used for processing historical data, but these come with limitations.
* **Dynamic Task Mapping:** Dynamic Task Mapping offers a more flexible way for parallel task processing. Use `.expand()` for mapping and `.partial()` for constants.
* **Modern Airflow:** Airflow keeps adding more features for elegant DAG writing, like the `@task.virtualenv` decorator or DAG parameters.

Our DuckDB example demonstrates the practical application of these concepts. We built a DAG that not only answers the Reddit user's question about leveraging partitions but also showcases modern Airflow features.

This isn't just about writing less code; it's about writing *better* code. Dynamic Task Mapping empowers you to:
* **Reduce maintenance:** One central location for your processing logic. No _daily_, _monthly_ or _custom_ DAG.
* **Improve performance:** Parallel processing reduces execution time.
* **Enhance readability:** Clean, concise code makes your DAGs easier to understand and maintain.
* **Increase flexibility:** Adapt to new processing scenarios without creating new DAGs.

Ready to break free from the DAG proliferation nightmare? What is your favorite modern Airflow feature?
