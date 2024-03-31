---
layout: post
title: Easter egg hunt with BigQuery and User-Defined Functions (UDFs)
description: Discover the basics of extensibility with BigQuery User-Defined Functions (UDFs) with a little Easter egg hunt game
date: 2024-03-31 10:00:00 +0300
image: '/images/blog/2024-03-31.jpg'
tags: [data engineering, tech, big query, gcp, sql]
toc: true
---

As a little _thank you_ to the Data Engineering community 🫶, I wrote this article where you will learn how to create and use a BigQuery User-Defined Function (UDF) by creating a little Easter egg hunt game 🐰.

![Easter egg UDF]({{site.baseurl}}/images/blog/2024-03-31-02.png)

# Introduction

Eggs represent new life and rebirth. The tradition of Easter egg hunts likely originated from pagan spring festivals where people searched for hidden eggs as a symbol of fertility and new beginnings. Over time, the egg hunt became associated with Easter as Christianity spread. Today, it's a fun activity for children during the Easter season.

And just like children searching for hidden treasures at Easter, data enthusiasts navigate data using BigQuery's vast amount of features seeking insights waiting to be unearthed beneath layers of raw data.

This hunt for insights can lead to a variety of scenarios where custom logic or specialized operations are required. In this case, BigQuery offers so called routines to extend the basic functionality of SQL. To name some of the typical scenarios:

* **Custom Data Transformations**: Routines are invaluable for performing custom data transformations that go beyond the capabilities of built-in SQL functions. Whether it's parsing complex data structures, applying domain-specific business rules, or formatting data for specific output formats.

* **Advanced Analytics and Processing**: Routines enable the implementation of advanced analytics and processing tasks within SQL queries. This includes tasks such as custom aggregations, text processing, geo-spatial analysis, temporal calculations, and machine learning integration. By encapsulating complex logic into reusable functions, routines empower analysts to perform sophisticated analysis directly within SQL.

* **Enhanced Data Quality and Validation**: Routines play a crucial role in ensuring data quality and consistency by facilitating data cleansing, validation, and enrichment tasks. Whether it's standardizing data formats, validating input values, or identifying outliers and anomalies.

Of course, there are more situations in which routines are helpful, but let's start by learning the basics.

## Routines

Before we jump into the topic of extending the functionality of BigQuery, let's put things into perspective. Google Cloud services are organized in a hierarchy of resources, whereas a resource can be anything from the top-level company resource, to a project, service or even a specific aspect of a service like datasets in BigQuery.

![Google Cloud resource hierarchy]({{site.baseurl}}/images/blog/2024-03-31-01.png)
*Google Cloud resource hierarchy*

One of these BigQuery specific resources are so called routines. More specifically, there are three types of routines:

* **Stored Procedures**,
* **User-Defined Functions** (UDFs), including _Remote Functions_ and
* **Table Functions**.

**Stored procedures**

Think of Stored Procedures as recipes with multiple steps. You can combine various SQL statements (like filtering, calculations) into a single procedure. They can accept inputs (ingredients) but don't directly return a value, just perform the defined actions.

{% highlight sql %}
CREATE OR REPLACE PROCEDURE mydataset.create_data()
BEGIN
  DECLARE id STRING;
  SET id = GENERATE_UUID();
  INSERT INTO mydataset.data (some_uuid)
  VALUES(id);
  SELECT FORMAT("added %s", id);
END
{% endhighlight %}

**User-defined functions (UDFs)**

User-Defined Functions (UDFs) are defined with a SQL expression or JavaScript code. UDFs take a set of input parameters, perform a calculation and return a single value.

{% highlight sql %}
CREATE TEMP FUNCTION multiply_values(x FLOAT64, y FLOAT64)
RETURNS FLOAT64
LANGUAGE js
AS r"""
  return x*y;
""";
{% endhighlight %}

**Table functions**

Table functions are like custom generators or data sources that you define to produce sets of rows or tables in BigQuery. They're great for transforming data into a different format or creating temporary datasets for analysis.

{% highlight sql %}
CREATE OR REPLACE TABLE FUNCTION mydataset.dates_between(
  from_date STRING,
  to_date STRING
) AS (
  SELECT *
  FROM UNNEST(GENERATE_DATE_ARRAY(
    from_date,
    to_date,
    INTERVAL 1 DAY
  )) AS d
);
{% endhighlight %}

## User Defined Functions (UDFs)

Much like cracking open an Easter egg to reveal its hidden surprise, let's delve into the simplicity and power of User-Defined Functions in BigQuery. With UDFs, we can craft an Easter basket, full of colorful functions, designed to streamline our data exploration and analysis.

In the following chapters, you learn how to create and use a UDF defined in SQL by creating a little Easter egg hunt game 🐰.

# Data preparation (hide the eggs)

For the implementation of our Easter egg hunt game, we will utilize a temporary table and function. Generally, in BigQuery, query results are stored in tables, which can be either permanent or temporary. Temporary tables are generated within a designated dataset and are assigned random names. They are cached and exist only for the duration of a session or within multi-statement queries.

This is ideal for our use-case, as it prevents colleagues from questioning the presence of Easter egg-related tables within the company's datasets 😉.

Some of us may recall a scenario from our childhood: It's that eagerly awaited time of the year when we venture out to search for those delightful, brightly colored eggs hidden somewhere in the garden. However, sometimes we stumble upon an unexpected find. We locate an egg, but it lacks the expected beauty and vibrancy, for it's one of those eggs forgotten years ago, hidden to well by the Easter bunny.

To circumvent such situations, we will establish a table to record the locations and whether an egg has been hidden there or not.

{% highlight sql %}
CREATE TEMP TABLE easter_eggs (
  id INT64,
  location STRING,
  has_egg BOOL
);
{% endhighlight %}

Since we want to play the game on our own, we should not know whether an egg has been placed in the location or not. So when populating the table, will use a random statement as part of the `INSERT`. This is also a great example how to utilize statements, which are evaluated on the fly rather than static values during the insert phase.

This is how we hide the eggs for our game:

{% highlight sql %}
INSERT INTO easter_eggs(id, location, has_egg) VALUES
(1, 'Under the table', (RAND() < 0.5)),
(2, 'Behind the door', (RAND() < 0.5)),
(3, 'On the shelf', (RAND() < 0.5)),
(4, 'In the flowerpot', (RAND() < 0.5)),
(5, 'Inside the mailbox', (RAND() < 0.5)),
(6, 'On top of the bookshelf', (RAND() < 0.5)),
(7, 'Beneath the sofa cushions', (RAND() < 0.5)),
(8, 'In the cookie jar', (RAND() < 0.5)),
(9, 'Behind the painting', (RAND() < 0.5)),
(10, 'Inside the kitchen cabinet', (RAND() < 0.5)),
(11, 'Underneath the bed', (RAND() < 0.5)),
(12, 'Inside the shoe rack', (RAND() < 0.5)),
(13, 'On the window sill', (RAND() < 0.5)),
(14, 'Inside the refrigerator', (RAND() < 0.5)),
(15, 'Behind the TV', (RAND() < 0.5));
{% endhighlight %}

![Hide the eggs]({{site.baseurl}}/images/blog/2024-03-31-03.png)

# User-Defined Function (egg hunt game)

Now it is time to define a UDF to play the game. The idea is simple:

The player should engage in the game by invoking the UDF and passing an **array of location IDs** to search for eggs. The UDF should then query our previously defined table for these locations and return the result. The result should indicate the number of eggs found and the locations where they were found, or simply return _no eggs found_, if the player was unlucky.

As mentioned before, UDFs can be a SQL statement or a JavaScript snippet. In our case, we are using a SQL statement. Since it must be a single statement returning a value, it must be enclosed in brackets. Additionally, we need to define the parameters with types and the return value type. Consequently, the basic structure looks like the following:

{% highlight sql %}
CREATE TEMP FUNCTION search_egg(location_ids ARRAY<INT64>)
RETURNS STRING
AS (...);
{% endhighlight %}

Within the UDF implementation, we utilize the built-in function `COUNTIF`, which returns the count of `TRUE` values for an expression. Our expression is `has_egg` which refers to the `boolean` column of our `easter_eggs` table. In other words, we count the locations where eggs have been hidden.

We also apply the `UNNEST` function to the users array input, in order to be able to us it as part of a `WHERE ... IN ...` statement.

Combined with a basic `CASE .. WHEN` statement, the final implementation of our UDF looks like this:

{% highlight sql %}
CREATE TEMP FUNCTION search_egg(location_ids ARRAY<INT64>)
RETURNS STRING
AS ((
  SELECT
    CASE
      WHEN COUNTIF(has_egg) > 0 THEN
        CONCAT(
          'Congratulations 🐰, you found ',
          CAST(COUNTIF(has_egg) AS STRING),
          ' egg(s) 🥚 in the following location(s): ',
          STRING_AGG(location, ', ')
        )
      ELSE 'No eggs found'
    END
  FROM
    easter_eggs
  WHERE
    id IN UNNEST(location_ids) AND
    has_egg
));
{% endhighlight %}

If any of the given location IDs has `has_egg` set to `TRUE`, we count the number of eggs and compute the list of locations with `STRING_AGG`. With `CONCAT` we create the final result. In case no location has an egg, we simply return the String `No eggs found`.

# Play the game

The heartwarming essence of the Easter egg hunt game lies in bringing smiles to the faces of children (and even adults at times). In our implementation, you're free to pass as many locations to search for eggs as you wish. Playing the game simply means calling the UDF with an array of location IDs.

{% highlight sql %}
-- Call the search_egg function with an array of location IDs betwen 1 and 15
-- to look for those shiny, colorful easter eggs 🐰
SELECT search_egg([1, 3, 8, 11, 15]);
{% endhighlight %}

If you run all queries, so defining and populating the table, creating and calling the UDF, BigQuery will run multiple statements. To see the result, click on the last _VIEW RESULTS_ button in the BigQuery window.

![View results]({{site.baseurl}}/images/blog/2024-03-31-04.png)

If you are lucky, you will get the number of eggs found together with the locations:

![Easter egg UDF]({{site.baseurl}}/images/blog/2024-03-31-02.png)

Or if you are unlucky:

![No eggs found]({{site.baseurl}}/images/blog/2024-03-31-05.png)

# Putting everything together

The following script shows the full game, feel free to run it in a BigQuery session and try it on your own:

{% highlight sql %}
CREATE TEMP TABLE easter_eggs (
  id INT64,
  location STRING,
  has_egg BOOL
);

INSERT INTO easter_eggs(id, location, has_egg) VALUES
(1, 'Under the table', (RAND() < 0.5)),
(2, 'Behind the door', (RAND() < 0.5)),
(3, 'On the shelf', (RAND() < 0.5)),
(4, 'In the flowerpot', (RAND() < 0.5)),
(5, 'Inside the mailbox', (RAND() < 0.5)),
(6, 'On top of the bookshelf', (RAND() < 0.5)),
(7, 'Beneath the sofa cushions', (RAND() < 0.5)),
(8, 'In the cookie jar', (RAND() < 0.5)),
(9, 'Behind the painting', (RAND() < 0.5)),
(10, 'Inside the kitchen cabinet', (RAND() < 0.5)),
(11, 'Underneath the bed', (RAND() < 0.5)),
(12, 'Inside the shoe rack', (RAND() < 0.5)),
(13, 'On the window sill', (RAND() < 0.5)),
(14, 'Inside the refrigerator', (RAND() < 0.5)),
(15, 'Behind the TV', (RAND() < 0.5));

CREATE TEMP FUNCTION search_egg(location_ids ARRAY<INT64>)
RETURNS STRING
AS ((
  SELECT
    CASE
      WHEN COUNTIF(has_egg) > 0 THEN
        CONCAT(
          'Congratulations 🐰, you found ',
          CAST(COUNTIF(has_egg) AS STRING),
          ' egg(s) 🥚 in the following location(s): ',
          STRING_AGG(location, ', ')
        )
      ELSE 'No eggs found'
    END
  FROM
    easter_eggs
  WHERE
    id IN UNNEST(location_ids) AND
    has_egg
));

-- Call the search_egg function with an array of location IDs betwen 1 and 15
-- to look for those shiny, colorful easter eggs 🐰
SELECT search_egg([1, 3, 8, 11, 15]);
{% endhighlight %}

# Conclusion

As we hop through the joyous fields of Easter egg hunts and BigQuery wonders, let's pause for a moment to appreciate the delightful fusion of fun and functionality that User-Defined Functions (UDFs) bring to the table.

Just like cracking open an Easter egg reveals a hidden surprise, exploring the world of UDFs unveils a treasure trove of possibilities for data exploration and analysis.

So, as you embark on your own data adventures, remember the magic of UDFs. They're not just tools; they can help centralizing and encapsulate custom data transformations, advanced processing and validation tasks to turn data into delightful insights. Happy Easter, and may your (data) hunts be filled with joy, laughter, and plenty of colorful eggs 🐰🥚!
