---
layout: post
title: Talk to Airflow - Build an AI Agent Using PydanticAI and Gemini 2.0
description: Create an AI agent with PydanticAI to interact with Airflow DAGs
date: 2024-12-24 09:00:00 +0300
image: '/images/blog/2024-12-24.jpg'
tags: [data-engineering, pydantic, pydantic-ai, python, gemini, agent, ai-agent, airflow, dag]
toc: true
---

# A Journey from Chaos to Control

In the pioneering days of aviation, pilots flew through clouds with little more than basic instruments and raw instinct. Each flight was a dance between human judgment and mechanical power, relying heavily on experience and intuition for success. A slight miscalculation or unexpected weather change could spell disaster. They used amazing technology with little control over it.

> When I first started integrating LLMs into production systems, I felt like one of those early pilots—commanding immense power with minimal instrumentation. Every deployment felt like a leap of faith.

![AI agents getting ready for Airflow]({{site.baseurl}}/images/blog/2024-12-24-03.jpg)
*AI agents getting ready for Airflow, source: generated with Adobe Firefly*

The landscape of AI development today mirrors those early aviation challenges. We have incredibly powerful models like **Gemini 2.0** at our disposal - capable of understanding context, generating human-like responses, and processing complex instructions. Yet, utilizing this power for production-grade applications often feels like flying through a storm without proper navigation tools.

But just as modern aviation evolved from risky adventures to reliable transportation through proper instrumentation and control systems, AI development is undergoing its own transformation toward agents. Unlike traditional AI, which simply responds to queries, agents actively engage with their environment. They make decisions, use tools, and execute tasks on your behalf. Modern AI agents, powered by LLMs like Gemini, understand natural language instructions, break down complex tasks into smaller steps, and provide structured output and monitoring.

This is where [PydanticAI](https://ai.pydantic.dev/) appears at the sky. Built by the team behind [Pydantic](https://pydantic.dev/)—the same foundation that powers numerous famous projects—it's a framework designed for modern AI development that brings control and reliability to agent systems.

Think of PydanticAI as your aircraft's modern cockpit—combining assistant systems, engine controls, and instrumentation panels into one coherent interface. It provides clear readings, predictable controls, and most importantly, the confidence to navigate through complex scenarios. It brings structure to chaos.

In this article, we'll put PydanticAI to the test by building an AI agent that interacts with [Apache Airflow](https://airflow.apache.org/). We'll create a system that can understand natural language queries about your workflows, fetch real-time status updates, and respond with structured, reliable data. No more flying blind through your DAG operations.

> 🚀 Want to jump straight into the code? Check out the project on GitHub:
> [https://github.com/vojay-dev/pydantic-airflow-agent](https://github.com/vojay-dev/pydantic-airflow-agent)

# Why PydanticAI? The FastAPI Feeling for AI Development

Building production-grade AI applications shouldn't feel like solving a puzzle. Yet, when I first explored the landscape of AI frameworks, that's exactly what it felt like. Let me share why PydanticAI is becoming my go-to choice for modern AI development.

## The Current Landscape

The AI framework ecosystem is rich with options:

- **[LangChain](https://www.langchain.com/)**: Comprehensive but complex, offering numerous integrations and features.
- **[crewAI](https://github.com/crewAIInc/crewAI)**: Specialized in multi-agent orchestration, great for complex agent interactions.
- **[Instructor](https://github.com/instructor-ai/instructor)**: Focused on structured outputs and instruction following.

Each has its strengths, but they often come with significant complexity and steep learning curves.

## PydanticAI Simplicity

{% highlight py %}
from pydantic_ai import Agent

agent = Agent('gemini-1.5-flash', system_prompt='Be concise.')
result = agent.run_sync('Why choose PydanticAI?')
{% endhighlight %}

> When I first saw the PydanticAI examples, it reminded me of my first FastAPI experience - clean, intuitive, and just right.

What sets PydanticAI apart:

**Built by the Pydantic Team**
- Deep integration with Pydantic's ecosystem
- Type safety that actually helps development
- Familiar patterns for FastAPI developers

**Production-Ready Design**
- Model-agnostic (OpenAI, Anthropic, Gemini, Ollama)
- Built-in dependency injection for testing
- Seamless Logfire integration for real-time monitoring

**Clean, Maintainable Code**
- Minimal boilerplate
- Strong type checking
- Intuitive error messages

> Note: The integration with Logfire is simple yet elegant, allowing for a detailed understanding of the flow of agents. There are impressive examples on the official PydanticAI page, but I haven't tried them yet. I highly recommend checking it out if you want to explore the framework beyond this article. If you do, feel free to let me know how it goes. 😉

## The Future of PydanticAI

The real power of PydanticAI lies in its alignment with modern Python development practices. As Pydantic continues to be the backbone of major Python frameworks and AI libraries, PydanticAI's tight integration becomes increasingly valuable.

Its future looks promising because:
- Growing Pydantic ecosystem integration
- Active development by the core Pydantic team
- Focus on developer experience and production readiness

When to consider alternatives? If you need LangChain's vast integrations, crewAI's multi-agent capabilities, or Instructor's specialized instruction handling. But for most AI applications, PydanticAI provides everything you need with less complexity.

PydanticAI brings the "FastAPI feeling" to AI development - and that's exactly what this space needs. It's not just about writing less code; it's about writing better, more maintainable AI applications.

> Note: PydanticAI is still in early development, but given the Pydantic team's track record, I'm confident in betting on its future. The framework is already showing what the future of AI development tools should look like.

# PydanticAI Basics: A Quick Start Guide

PydanticAI makes building AI agents feel as natural as writing regular Python code. Let's look at three core patterns that make it powerful yet simple to use.

> I will keep this brief because, honestly, the PydanticAI documentation is among the best I have ever read. Generally, Pydantic projects feature excellent documentation with an engaging, informative, and enjoyable writing style. Therefore, the best way to gain more information is to consult the documentation directly. This article aims to go beyond the documentation and explore a creative real-world application of the framework.

**Basic Agents**

{% highlight py %}
agent = Agent('gemini-1.5-flash', system_prompt='Be concise.')
result = agent.run_sync('What is PydanticAI?')
{% endhighlight %}

At its simplest, an agent is just a wrapper around an LLM that handles the conversation flow. You choose your model, set a system prompt, and start chatting.

**Structured Outputs**

{% highlight py %}
class WeatherInfo(BaseModel):
    temperature: float
    condition: str

weather_agent = Agent('gemini-1.5-flash', result_type=WeatherInfo)
{% endhighlight %}

Instead of parsing free text, PydanticAI guides the LLM to return structured data. Your IDE gets type hints, and you get guaranteed data structure.

**Tools**

{% highlight py %}
@agent.tool
async def get_temperature(city: str) -> float:
    """Fetch current temperature for a city."""
    return await weather_api.get(city)
{% endhighlight %}

Tools are functions your agent can call. They extend your agent's capabilities beyond conversation to real actions like API calls or data fetching.

> What's particularly clever about PydanticAI's tool system is how it handles function signatures. The framework automatically extracts parameters (except `RunContext`) to build the tool's schema, and even pulls parameter descriptions from your docstrings using [griffe](https://mkdocstrings.github.io/griffe/).

This intelligent parsing means your tools are not just functional – they're self-documenting. The LLM understands exactly how to use them because the documentation is built right into the schema. No more manually maintaining separate descriptions of your tools!

> What I love about PydanticAI is how these patterns compose naturally. Start with a basic agent, add structure when you need clean data, and sprinkle in tools when you need real-world interactions. It grows with your needs! 🛠️

This foundation is all you need to start building powerful AI agents. In our Airflow example coming up, we'll see how these patterns work together in a real application.

# Mirror, Mirror on the Wall, What's the DAG Status After All?

The complete code for this tutorial is available on GitHub. While we'll walk through the key components here, feel free to clone the repository to follow along:

{% highlight sh %}
git clone git@github.com:vojay-dev/pydantic-airflow-agent.git
{% endhighlight %}

> Bear in mind that PydanticAI is under heavy development, which is great, but it also means that details of this demo project might change in the future. However, it will definitely help you gain a good understanding of the basic principles and inspire your own PydanticAI project.

With this project, we aim to go beyond the documentation and basic examples. Let's create an AI agent that can interact with Airflow via the [Airflow REST API](https://airflow.apache.org/docs/apache-airflow/stable/stable-rest-api-ref.html). You will be able to ask it about the status of a DAG without needing to specify an exact DAG ID. Simply describe the DAG, and the agent will identify the most relevant one by retrieving all DAGs from the API. It will then fetch the status of the selected DAG and return the information in a structured format.

For simplicity, we are using a local Airflow environment with Docker and [Astro CLI](https://www.astronomer.io/docs/astro/cli/overview/) (install via `brew install astro`), which is an effective way to start Airflow projects. We will integrate our PydanticAI agent and Airflow setup within the same project for ease of use. Typically, these would be two separate components.

> We are using the latest version of Airflow, **2.10.4**, as of the time of writing this article. If you are reading this after the release of Airflow 3, that’s amazing! I can’t wait for the new UI and other great features. However, this also means that things may have changed significantly. Still, you should be able to get an idea of how to adapt to it.

First, let's set up the project using Poetry and install the required dependencies, starting with PydanticAI and then creating an Airflow environment via Astro CLI.

{% highlight sh %}
poetry new pydantic-airflow-agent
cd pydantic-airflow-agent
poetry add pydantic-ai
poetry add colorlog
{% endhighlight %}

Before adding the Airflow dependency, change the Python requirement in `pyproject.toml`:

{% highlight toml %}
python = ">=3.12,<3.13"
{% endhighlight %}

Now, add the Airflow dependency:

{% highlight sh %}
poetry add apache-airflow
{% endhighlight %}

Finally, spin up the local Airflow environment:

{% highlight sh %}
astro dev init # confirm to create the project in a non-empty directory
astro dev start
{% endhighlight %}

## Implement some sample DAGs

The focus is the PydanticAI driven AI agent, however, without some DAGs we have nothing to interact with. We go as minimal as possible and simply add to DAGs doing nothing essentially.

{% highlight py %}
import pendulum
from airflow.decorators import dag, task
from airflow.operators.smooth import SmoothOperator

start_date = pendulum.datetime(2024, 12, 1, tz="UTC")

@dag(schedule='@daily', start_date=start_date)
def payment_report():
    SmoothOperator(task_id='some_task')

@dag(schedule='@daily', start_date=start_date)
def customer_profile():
    SmoothOperator(task_id='some_task')

payment_report()
customer_profile()
{% endhighlight %}

> If you don't know about `SmoothOperator` yet, check the logs for it in Airflow. It's a delightful little Easter egg that brings a smile to the faces of us Data Engineers.

![Local Airflow setup with two example DAGs]({{site.baseurl}}/images/blog/2024-12-24-01.png)
*Local Airflow setup with two example DAGs, source: by author*

## Implement an Airflow AI agent with PydanticAI

Since we want to interact with Airflow through the Airflow REST API, we can derive some of the agent's dependencies from it. We need the base URI of our Airflow service, the port on which the API is running, and a username and password.

We also expect our AI agent to respond with a structured object that represents the state of a DAG, including several interesting attributes. Let's define both the dependencies and the output model.

{% highlight py %}
@dataclass
class Deps:
    airflow_api_base_uri: str
    airflow_api_port: int
    airflow_api_user: str
    airflow_api_pass: str

class DAGStatus(BaseModel):
    dag_id: str = Field(description='ID of the DAG')
    dag_display_name: str = Field(description='Display name of the DAG')
    is_paused: bool = Field(description='Whether the DAG is paused')
    next_dag_run_data_interval_start: str = Field(description='Next DAG run data interval start')
    next_dag_run_data_interval_end: str = Field(description='Next DAG run data interval end')
    last_dag_run_id: str = Field(default='No DAG run', description='Last DAG run ID')
    last_dag_run_state: str = Field(default='No DAG run', description='Last DAG run state')
    total_dag_runs: int = Field(description='Total number of DAG runs')
{% endhighlight %}

With that, we can define our model and Agent. For this example, we use the latest Gemini 2.0 Flash model.

> Note: I experimented extensively with various models. Many models struggled to interact with tool functions in the correct order or to use the results for constructing the final structured output. Gemini 2.0 Flash provided the best results, but I also recommend trying other supported models. You can use models via Ollama, such as Mistral or Llama 3.3, both of which also support tool functions and structured output. However, for this demo, we will use the model that gave the best results. Ultimately, we want to have an agent we can trust. Would you fly on an airplane that only sometimes works?

{% highlight py %}
model = VertexAIModel(
    model_name='gemini-2.0-flash-exp',
    service_account_file='gcp-credentials.json'
)

airflow_agent = Agent(
    model=model,
    system_prompt=(
        'You are an Airflow monitoring assistant. For each request:\n'
        '1. Use `list_dags` first to get available DAGs\n'
        '2. Match the user request to the most relevant DAG ID\n'
        '3. Use `get_dag_status` to fetch the DAG status details'    ),
    result_type=DAGStatus,
    deps_type=Deps,
    retries=2
)
{% endhighlight %}

As you can see, I am quite strict and clear about how the agent should handle requests and interact with tool functions. This largely depends on the model you use. Depending on the use case, it can sometimes work well not to specify any tool functions explicitly in the system prompt.

Next, let us add a tool function so that our AI agent can retrieve a list of DAGs. We will return the DAG IDs and display names, allowing the model to select the DAG that best fits the user's question.

{% highlight py %}
@airflow_agent.tool
async def list_dags(ctx: RunContext[Deps]) -> str:
    """
    Get a list of all DAGs from the Airflow instance. Returns DAGs with their IDs and display names.
    """
    logger.info('Getting available DAGs...')
    uri = f'{ctx.deps.airflow_api_base_uri}:{ctx.deps.airflow_api_port}/api/v1/dags'
    auth = (ctx.deps.airflow_api_user, ctx.deps.airflow_api_pass)

    async with AsyncClient() as client:
        response = await client.get(uri, auth=auth)
        response.raise_for_status()

        dags_data = response.json()['dags']
        result = json.dumps([
            {'dag_id': dag['dag_id'], 'dag_display_name': dag['dag_display_name']} for dag in dags_data
        ])
        logger.debug(f'Available DAGs: {result}')
        return result
{% endhighlight %}

Each tool function receives the `RunContext`, which contains the previously defined dependencies. This allows us to easily connect to the Airflow API and fetch the necessary data.

Once the agent determines which DAG ID best fits the user's requests, it must retrieve the details about the DAG and its runs to compute the structured output, also known as the model class we defined earlier.

Therefore, let's add another tool function to obtain the details.

{% highlight py %}
@airflow_agent.tool
async def get_dag_status(ctx: RunContext[Deps], dag_id: str) -> str:
    """
    Get detailed status information for a specific DAG by DAG ID.
    """
    logger.info(f'Getting status for DAG with ID: {dag_id}')
    base_url = f'{ctx.deps.airflow_api_base_uri}:{ctx.deps.airflow_api_port}/api/v1'
    auth = (ctx.deps.airflow_api_user, ctx.deps.airflow_api_pass)

    try:
        async with AsyncClient() as client:
            dag_response = await client.get(f'{base_url}/dags/{dag_id}', auth=auth)
            dag_response.raise_for_status()

            runs_response = await client.get(
                f'{base_url}/dags/{dag_id}/dagRuns',
                auth=auth,
                params={'order_by': '-execution_date', 'limit': 1}
            )
            runs_response.raise_for_status()

            result = {
                'dag_data': dag_response.json(),
                'runs_data': runs_response.json()
            }

            logger.debug(f'DAG status: {json.dumps(result)}')
            return json.dumps(result)

    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return f'DAG with ID {dag_id} not found'
        raise
{% endhighlight %}

With that, we have all tools we need and can run the agent as follows.

{% highlight py %}
async def main():
    deps = Deps(
        airflow_api_base_uri='http://localhost',
        airflow_api_port=8080,
        airflow_api_user='admin',
        airflow_api_pass='admin'
    )

    user_request = 'What is the status of the DAG for our daily payment report?'
    result = await airflow_agent.run(user_request, deps=deps)
    pprint(result.data)

if __name__ == "__main__":
    asyncio.run(main())
{% endhighlight %}

You might notice that many operations in PydanticAI use `async` and `await`. This isn't just a random choice - it's a powerful feature that makes our applications more efficient, especially when dealing with I/O operations like API calls or model interactions.

Think of async like being an expert multitasker. When you're cooking, you don't wait idly by the stove for water to boil - you prep other ingredients while waiting. That's what async does for our code. When our agent makes an API call or waits for an LLM response, instead of blocking everything else, it can handle other tasks - like processing another request or updating logs. This is particularly valuable in production environments where efficiency matters.

Let's combine everything before we dive into the demo. Here is the complete Airflow AI agent code with PydanticAI.

{% highlight py %}
import asyncio
import json
import logging
from dataclasses import dataclass
from devtools import pprint

import colorlog
import httpx
from httpx import AsyncClient
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.vertexai import VertexAIModel

log_format = '%(log_color)s%(asctime)s [%(levelname)s] %(reset)s%(purple)s[%(name)s] %(reset)s%(blue)s%(message)s'
handler = colorlog.StreamHandler()
handler.setFormatter(colorlog.ColoredFormatter(log_format))
logging.basicConfig(level=logging.INFO, handlers=[handler])

logger = logging.getLogger(__name__)

@dataclass
class Deps:
    airflow_api_base_uri: str
    airflow_api_port: int
    airflow_api_user: str
    airflow_api_pass: str

class DAGStatus(BaseModel):
    dag_id: str = Field(description='ID of the DAG')
    dag_display_name: str = Field(description='Display name of the DAG')
    is_paused: bool = Field(description='Whether the DAG is paused')
    next_dag_run_data_interval_start: str = Field(description='Next DAG run data interval start')
    next_dag_run_data_interval_end: str = Field(description='Next DAG run data interval end')
    last_dag_run_id: str = Field(default='No DAG run', description='Last DAG run ID')
    last_dag_run_state: str = Field(default='No DAG run', description='Last DAG run state')
    total_dag_runs: int = Field(description='Total number of DAG runs')

model = VertexAIModel(
    model_name='gemini-2.0-flash-exp',
    service_account_file='gcp-credentials.json'
)

airflow_agent = Agent(
    model=model,
    system_prompt=(
        'You are an Airflow monitoring assistant. For each request:\n'
        '1. Use `list_dags` first to get available DAGs\n'
        '2. Match the user request to the most relevant DAG ID\n'
        '3. Use `get_dag_status` to fetch the DAG status details'
    ),
    result_type=DAGStatus,
    deps_type=Deps,
    retries=2
)

@airflow_agent.tool
async def list_dags(ctx: RunContext[Deps]) -> str:
    """
    Get a list of all DAGs from the Airflow instance. Returns DAGs with their IDs and display names.
    """
    logger.info('Getting available DAGs...')
    uri = f'{ctx.deps.airflow_api_base_uri}:{ctx.deps.airflow_api_port}/api/v1/dags'
    auth = (ctx.deps.airflow_api_user, ctx.deps.airflow_api_pass)

    async with AsyncClient() as client:
        response = await client.get(uri, auth=auth)
        response.raise_for_status()

        dags_data = response.json()['dags']
        result = json.dumps([
            {'dag_id': dag['dag_id'], 'dag_display_name': dag['dag_display_name']} for dag in dags_data
        ])
        logger.debug(f'Available DAGs: {result}')
        return result

@airflow_agent.tool
async def get_dag_status(ctx: RunContext[Deps], dag_id: str) -> str:
    """
    Get detailed status information for a specific DAG by DAG ID.
    """
    logger.info(f'Getting status for DAG with ID: {dag_id}')
    base_url = f'{ctx.deps.airflow_api_base_uri}:{ctx.deps.airflow_api_port}/api/v1'
    auth = (ctx.deps.airflow_api_user, ctx.deps.airflow_api_pass)

    try:
        async with AsyncClient() as client:
            dag_response = await client.get(f'{base_url}/dags/{dag_id}', auth=auth)
            dag_response.raise_for_status()

            runs_response = await client.get(
                f'{base_url}/dags/{dag_id}/dagRuns',
                auth=auth,
                params={'order_by': '-execution_date', 'limit': 1}
            )
            runs_response.raise_for_status()

            result = {
                'dag_data': dag_response.json(),
                'runs_data': runs_response.json()
            }

            logger.debug(f'DAG status: {json.dumps(result)}')
            return json.dumps(result)

    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            return f'DAG with ID {dag_id} not found'
        raise

async def main():
    deps = Deps(
        airflow_api_base_uri='http://localhost',
        airflow_api_port=8080,
        airflow_api_user='admin',
        airflow_api_pass='admin'
    )

    user_request = 'What is the status of the DAG for our daily payment report?'
    result = await airflow_agent.run(user_request, deps=deps)
    pprint(result.data)

if __name__ == "__main__":
    asyncio.run(main())
{% endhighlight %}

> What I found essential is having high transparency regarding how the agent makes tool and LLM calls during development. In the example above, we use logging. However, I highly recommend checking out the Logfire integration.

## Demo

Time to let the magic happen. Let's run our agent with the following user question:

> What is the status of the DAG for our daily payment report?

Remember, we have two DAGs defined: `payment_report` and `customer_profile`. In the question above, we do not use the exact DAG IDs; the agent has to determine them on its own. Let's see how it handles our request by examining the output.

{% highlight sh %}
(.venv) ~/projects/pydantic-airflow-agent
poetry run python pydantic_airflow_agent/agent.py
2024-12-23 14:49:05,127 [INFO] [httpx] HTTP Request: POST https://us-central1-aiplatform.googleapis.com/v1/projects/vojay-329716/locations/us-central1/publishers/google/models/gemini-2.0-flash-exp:generateContent "HTTP/1.1 200 OK"
2024-12-23 14:49:05,132 [INFO] [__main__] Getting available DAGs...
2024-12-23 14:49:05,241 [INFO] [httpx] HTTP Request: GET http://localhost:8080/api/v1/dags "HTTP/1.1 200 OK"
2024-12-23 14:49:06,640 [INFO] [httpx] HTTP Request: POST https://us-central1-aiplatform.googleapis.com/v1/projects/vojay-329716/locations/us-central1/publishers/google/models/gemini-2.0-flash-exp:generateContent "HTTP/1.1 200 OK"
2024-12-23 14:49:06,643 [INFO] [__main__] Getting status for DAG with ID: payment_report
2024-12-23 14:49:06,721 [INFO] [httpx] HTTP Request: GET http://localhost:8080/api/v1/dags/payment_report "HTTP/1.1 200 OK"
2024-12-23 14:49:06,798 [INFO] [httpx] HTTP Request: GET http://localhost:8080/api/v1/dags/payment_report/dagRuns?order_by=-execution_date&limit=1 "HTTP/1.1 200 OK"
2024-12-23 14:49:09,915 [INFO] [httpx] HTTP Request: POST https://us-central1-aiplatform.googleapis.com/v1/projects/vojay-329716/locations/us-central1/publishers/google/models/gemini-2.0-flash-exp:generateContent "HTTP/1.1 200 OK"

DAGStatus(
    dag_id='payment_report',
    dag_display_name='payment_report',
    is_paused=False,
    next_dag_run_data_interval_start='2024-12-23T00:00:00+00:00',
    next_dag_run_data_interval_end='2024-12-24T00:00:00+00:00',
    last_dag_run_id='scheduled__2024-12-22T00:00:00+00:00',
    last_dag_run_state='success',
    total_dag_runs=22,
)
{% endhighlight %}

As you can see, it started by fetching the available DAGs:

{% highlight sh %}
2024-12-23 14:49:05,132 [INFO] [__main__] Getting available DAGs...
{% endhighlight %}

It then selected the DAG which fits best to the user input, and used the other tool function to get the details:

{% highlight sh %}
2024-12-23 14:49:06,643 [INFO] [__main__] Getting status for DAG with ID: payment_report
{% endhighlight %}

And finally used structured output to return a `DAGStatus` instance.

![The Airflow AI agent powered by PydanticAI in action]({{site.baseurl}}/images/blog/2024-12-24-02.png)
*The Airflow AI agent powered by PydanticAI in action, source: by author*

> Honestly, the first time I ran this successfully, it blew me away. This powerful prototype combines simplicity with type-safe integration, and I was immediately hooked. I began to think about how to generate value with such an agent. For example, imagine someone asks in the data team's Slack channel why a specific report did not update. Such an agent could autonomously find the related DAG and engage in a conversation with the user while the Data Engineering team enjoys their coffee in peace. ☕

# From Blind Flight to Clear Skies

This article has shown that building production-grade AI applications doesn't have to feel like navigating through a storm. With the right tools and frameworks, it can be as straightforward as modern air travel—powerful, yet controlled and reliable.

The landscape of AI development is evolving rapidly, but frameworks like PydanticAI give us a steady foundation to build upon. Like modern aviation continues to advance while maintaining its core principles of safety and reliability, PydanticAI sets the stage for future innovations without sacrificing stability.

> Keep an eye on the PydanticAI project. With the amazing team behind it and the framework's elegant design, I believe we are only seeing the beginning of its potential. 🚀

Whether you're building AI agents for Airflow monitoring, customer support, or any other use case, remember: you don't have to fly blind anymore. The instruments are here, the controls are intuitive, and the skies are clear for takeoff.

Now, if you'll excuse me, I have some DAGs to chat with! 😉
