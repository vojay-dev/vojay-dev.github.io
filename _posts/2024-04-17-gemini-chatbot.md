---
layout: post
title: Create your own Gemini AI-chatbot with a twist using Python, Jinja2 and NiceGUI
description: Discover the basics of using Gemini with Python via VertexAI, creating a Web UI with NiceGUI and using Jinja2 to construct modular prompts
date: 2024-04-17 10:00:00 +0300
image: '/images/blog/2024-04-17.jpg'
tags: [data engineering, tech, nicegui, gcp, python, ai, gemini]
toc: true
---

Within this article, we will create a LLM-driven web-application, using various technologies, such as: Python, [NiceGUI](https://nicegui.io/){:target="_blank"}, [Jinja2](https://jinja.palletsprojects.com/){:target="_blank"} and [VertexAI](https://cloud.google.com/vertex-ai){:target="_blank"}. You will learn how to create such a project from the very beginning and get an overview of the underlying concepts.

The result will be your very own chatbot, but with a twist: the user will be able to select different personalities to get surprising answers from the AI.

Let's start with a quick overview of the 🚀 **tech stack**:

- Python 3.12
- [NiceGUI](https://nicegui.io/){:target="_blank"} to code our frontend in Python
- [Poetry](https://python-poetry.org/){:target="_blank"} for dependency management
- [Jinja2](https://jinja.palletsprojects.com/){:target="_blank"} templating for modular prompt generation

# Project setup with Poetry

Let's start by having a closer look how to create the project and how dependencies are managed in general. For this, we are using [Poetry](https://python-poetry.org/){:target="_blank"}, a tool for dependency management and packaging in Python.

The three main tasks Poetry can help you with are: Build, Publish and Track. The idea is to have a deterministic way to manage dependencies, to share your project and to track dependency states.

Poetry also handles the creation of virtual environments for you. Per default, those are in a centralized folder within your system. However, if you prefer to have the virtual environment of project in the project folder, like I do, it is a simple config change:

{% highlight sh %}
poetry config virtualenvs.in-project true
{% endhighlight %}

With `poetry new` you can then create a new Python project. It will create a virtual environment linking you systems default Python. If you combine this with [pyenv](https://github.com/pyenv/pyenv){:target="_blank"}, you get a flexible way to create projects using specific versions. Alternatively, you can also tell Poetry directly which Python version to use: `poetry env use /full/path/to/python`.

Once you have a new project, you can use `poetry add` to add dependencies to it.

Let's start by creating a new project:

{% highlight sh %}
poetry config virtualenvs.in-project true
poetry new my-gemini-chatbot
cd my-gemini-chatbot
{% endhighlight %}

The metadata about your projects, including the dependencies with the respective versions, are stored in the `.toml` and `.lock` files.

![New Poetry project]({{site.baseurl}}/images/blog/2024-04-17-01.png)

Now let's add the dependencies we need to get started with:

{% highlight sh %}
poetry add 'google-cloud-aiplatform>=1.38'
poetry add 'nicegui'
{% endhighlight %}

# Basic web UI with NiceGUI

NiceGUI is a Python library that allows to create graphical user interfaces (GUIs) for web browsers. Even beginners can get started quickly, but it also offers plenty of options for customization for more advanced users. The web view is based on the [Quasar Framework](https://quasar.dev/){:target="_blank"}, which offers plenty of components. That again uses [TailwindCSS](https://tailwindcss.com/){:target="_blank"}, so you can also directly use TailwindCSS classes for your NiceGUI pages.

Especially for me as a Data Engineer coming from Backend Software Development, this is a nice way to create small web UIs just using Python. Of course, for more complex frontends, this might not be the a sufficient solution but if the scope is rather small, you will be able to quickly see results. NiceGUI lets you focus on the Python code for your application, because it handles all the behind-the-scenes web development tasks.

NiceGUI uses common UI components like buttons, sliders, and text boxes, and arranges them on pages using flexible layouts. These components can be linked to data in your Python code, so the interface updates automatically when the data changes. You can also style the appearance of your app to fit your needs.

The easiest way to explain how it works is to show it. So let us start by creating a minimal example.

Create a `main.py` in your module (so `my_gemini_chatbot` in my case), which will be used for all of our application and frontend logic.

With the following code, you get a simple page with a label:

{% highlight py %}
from nicegui import ui

ui.label('Hello NiceGUI!')
ui.run()
{% endhighlight %}

![Hello NiceGUI]({{site.baseurl}}/images/blog/2024-04-17-02.png)

When you run the application, it will be available on port `8080`. It will also open the page automatically for you, when executing the script. And this is how it looks like:

![Hello NiceGUI]({{site.baseurl}}/images/blog/2024-04-17-03.png)

Congratulations: Your first frontend with pure Python 😉.

# Prepare chatbot web UI

The next step is to prepare the web UI for our chatbot. Of course, this will be a little more complex than the example above, but once you get the basic idea of how to place components with NiceGUI, things will become easier.

First, we need to understand some layout basics. There are multiple ways how to control the way how components are placed on the page. One common way is the grid layout, which we will be using.

In NiceGUI, we can create a grid like this:

{% highlight py %}
from nicegui import ui

with ui.grid(columns=16).classes("w-3/4 place-self-center gap-4"):
    ui.markdown("# 🚀 My Gemini Chatbot").classes("col-span-full")

ui.run()
{% endhighlight %}

Let's deconstruct that one by one to get a better understanding. `ui.grid(columns=16)` initializes a grid layout, which is split into 16 columns, which all have the same width. This does not say anything about the actual width of our grid, just into how many columns it should be separated. With 16 columns, we have enough flexibility.

With `.classes` we can add custom [TailwindCSS](https://tailwindcss.com/){:target="_blank"} classes. Here, we added 3 classes to our grid:
- `w-3/4`: The grid should always take 3/4 of the full width of the browser
- `place-self-center`: The grid itself should be centered in the browser window
- `gap-4`: There should be 4 pixels between elements within the grid

In the above example, we then placed one element in the grid:

{% highlight py %}
with ui.grid(columns=16).classes("w-3/4 place-self-center gap-4"):
    ui.markdown("# 🚀 My Gemini Chatbot").classes("col-span-full")
{% endhighlight %}

As you can see, we again assigned a custom class called `col-span-full`, which tells NiceGUI, that this element should use all available columns of the first row. In our case: all 16 rows.

There are classes for every amount of columns, so you can also fill one row with 2 elements by assigning `col-span-10` to the first and `col-span-6` to the second element.

![Hello NiceGUI]({{site.baseurl}}/images/blog/2024-04-17-11.png)

With this knowledge, we can add all the elements we need for our chatbot:

{% highlight py %}
from nicegui import ui

with ui.grid(columns=16).classes("w-3/4 place-self-center gap-4"):
    ui.markdown("# 🚀 My Gemini Chatbot").classes("col-span-full")
    ui.input(label="Prompt").classes("col-span-10")
    ui.select(
        options=["Default", "Santa Claus"],
        value="Default",
        label="Personality"
    ).classes("col-span-6")
    ui.button("Send to Gemini").classes("col-span-full")

    with ui.card().classes("col-span-full"):
        ui.markdown("## Gemini Response")
        ui.separator()
        ui.label("Send your prompt to Gemini and see the response here.")

ui.run()
{% endhighlight %}

Which will result in the following web UI:

![Hello NiceGUI]({{site.baseurl}}/images/blog/2024-04-17-04.png)

Not too bad for a UI entirely coded in Python.

# Add basic functionality

The next task for us, is to add basic functionality. We will not yet interact with VertexAI or Gemini but we want to add the feature, that if the _Send to Gemini button_ is clicked, a notification reflecting the user input should pop up.

There is one important concept to explain: our frontend is served by one instance of our Python script. Now imagine, we would store the user input in a global variable and another user, who is using the chatbot at the same time, would submit another value. Then the value of the first user would be overwritten, which would lead to funny but unexpected behavior.

Recently NiceGUI introduced the [Storage feature](https://nicegui.io/documentation/storage){:target="_blank"} to handle such situations. This is a straightforward mechanism for data persistence based on five built-in storage types, some of them storing data client-side and others server-side.

However, the Storage feature can only be used in the context of page builders. Basically this means: instead of simple coding our web page in the main script, we wrap that into a function per page. We only have one page, so we only need one function: `index()`. Then we tell NiceGUI with a decorator, that this function defines a page together with the path of the page, which is simply `/` for the main index page:

{% highlight py %}
@ui.page('/')
def index():
    with ui.grid(columns=16).classes("w-3/4 place-self-center gap-4"):
{% endhighlight %}

Now that we are using the page decorator, we are able to use the Storage feature as well. We will use a simple client side storage. To do so, we need to import `app` from `nicegui` and then we can access a dictionary based storage like: `app.storage.client`.

Another feature from NiceGUI which makes it easy to work with data is binding input elements to variables. That way, we can bind the input element for our user prompt to a variable stored in the client storage mentioned above:

{% highlight py %}
ui.input(label="Prompt").bind_value(app.storage.client, "prompt").classes("col-span-10")
{% endhighlight %}

Now the value of the input element can always be accessed with: `app.storage.client.get("personality")`.

Also, NiceGUI allows to define `on_click` parameters for buttons and other elements. This parameter takes a reference to a regular Python function. That way, we can make our web application interactive.

To begin with, we will introduce a `send()` function. We will use that later to interact with the Gemini LLM. For now, we will simply show a notification to the user with the current input values of our form.

{% highlight py %}
from nicegui import ui, app


def send():
    prompt = app.storage.client.get("prompt")
    personality = app.storage.client.get("personality")
    ui.notify(
        f"Prompt: {prompt}, Personality: {personality}",
        type="info"
    )


@ui.page('/')
def index():
    with ui.grid(columns=16).classes("w-3/4 place-self-center gap-4"):
        ui.markdown("# 🚀 My Gemini Chatbot").classes("col-span-full")
        ui.input(label="Prompt").bind_value(app.storage.client, "prompt").classes("col-span-10")
        ui.select(
            options=["Default", "Santa Claus"],
            value="Default",
            label="Personality"
        ).bind_value(app.storage.client, "personality").classes("col-span-6")
        ui.button("Send to Gemini", on_click=send).classes("col-span-full")

        with ui.card().classes("col-span-full"):
            ui.markdown("## Gemini Response")
            ui.separator()
            ui.label("Send your prompt to Gemini and see the response here.")


ui.run()
{% endhighlight %}

Now, whenever the user hits the "Send to Gemini" button, a notification is shown via the `send()` function showing the values of the input elements.

![User interaction]({{site.baseurl}}/images/blog/2024-04-17-05.png)

# Modular prompts with Jinja2

Time to add the twist 🌪️. Instead of simply sending the user prompt to Gemini, we will construct a modular prompt based on the user input. With that, we will programatically add a personality part to the prompt, so that the AI will reply with different personalities, based on the users selection.

Jinja2 is a template engine for Python. Jinja2 facilitates the creation of dynamic content across various domains. It separates logic from presentation, allowing for clean and maintainable codebases.

It uses the following core concepts:
{% raw %}
- Templates: Text files containing content specific to the use case (e.g., HTML, configuration files, SQL queries).
- Environment: Manages template configuration (e.g., delimiters, autoescaping).
- Variables: Inserted into templates using double curly braces (`{{ variable }}`).
- Blocks: Defined with `{% ... %}` tags for control flow (e.g., loops, conditionals).
- Comments: Enclosed in `{# ... #}` for code readability.
{% endraw %}

Even though Jinja2 is often used in web development, since it enables the creation of dynamic content, it is also used for other cases like Airflow.

For us, in this project, we will use it to define a general template with variables, that are replaced with a specific personality and the user prompt. That way, our Python code is kept clean and we have a modular solution that can easily be extended. Spoiler: we will introduce a very funny personality later.

Before we can use Jinja2, we need to add it as a dependency to our project. Since we are using Poetry, this is done via:

{% highlight sh %}
poetry add jinja2
{% endhighlight %}

We also need a folder to store our templates. A good default practice is to add a folder called `templates` to the module folder, so in this case:

{% highlight sh %}
mkdir my_gemini_chatbot/templates
{% endhighlight %}

![User interaction]({{site.baseurl}}/images/blog/2024-04-17-06.png)

To use Jinja2, we need to setup the environment. As explained above, the environment manages the general template configuration. We will keep it simple and just ensure that Jinja2 finds the templates in our folder:

{% highlight py %}
env = Environment(
    loader=PackageLoader("my_gemini_chatbot"),
    autoescape=select_autoescape()
)
{% endhighlight %}

Now it is time to prepare our templates. Within `templates/` folder, create 3 files: `prompt.jinja`, `default.jinja` and `santaclaus.jinja`. Leave `default.jinja` empty, since the default personality will just be the normal behavior of Gemini.

![User interaction]({{site.baseurl}}/images/blog/2024-04-17-07.png)

Let's add the following content to the `prompt.jinja` template. This is our base template:

{% highlight text %}
{% raw %}
{{ personality }}

{{ prompt }}
{% endraw %}
{% endhighlight %}

Now, let's define the Santa Claus personality, by adding the following content to `santaclaus.jinja`:

{% highlight text %}
You are Santa Claus and you love Christmas. Add as many Christmas related facts and trivia to your answers as you can. Also start your reply always strictly with "Ho ho ho" and end it with "Merry Christmas". You are a real Christmas enthusiast.
{% endhighlight %}

Quick reminder: we have a select element in the web UI to select the personality:

{% highlight py %}
ui.select(
    options=["Default", "Santa Claus"],
    value="Default",
    label="Personality"
).bind_value(app.storage.client, "personality").classes("col-span-6")
{% endhighlight %}

We will use a little helper function, which maps the value of the select to a template file:

{% highlight py %}
def get_personality_file(value):
    match value:
        case "Default":
            return "default.jinja"
        case "Santa Claus":
            return "santaclaus.jinja"
        case _:
            return "default.jinja"
{% endhighlight %}

Now we can use this helper function and the `get_template` function of the Jinja2 environment to construct the prompt with our templates:

{% highlight py %}
from jinja2 import Environment, PackageLoader, select_autoescape
from nicegui import ui, app


env = Environment(
    loader=PackageLoader("my_gemini_chatbot"),
    autoescape=select_autoescape()
)


def get_personality_file(value):
    match value:
        case "Default":
            return "default.jinja"
        case "Santa Claus":
            return "santaclaus.jinja"
        case _:
            return "default.jinja"


def send():
    user_prompt = app.storage.client.get("prompt")
    personality = app.storage.client.get("personality")

    personality_template = env.get_template(get_personality_file(personality))
    prompt_template = env.get_template("prompt.jinja")

    prompt = prompt_template.render(
        prompt=user_prompt,
        personality=personality_template.render()
    )

    ui.notify(
        f"Prompt: {prompt}",
        type="info"
    )


@ui.page('/')
def index():
    with ui.grid(columns=16).classes("w-3/4 place-self-center gap-4"):
        ui.markdown("# 🚀 My Gemini Chatbot").classes("col-span-full")
        ui.input(label="Prompt").bind_value(app.storage.client, "prompt").classes("col-span-10")
        ui.select(
            options=["Default", "Santa Claus"],
            value="Default",
            label="Personality"
        ).bind_value(app.storage.client, "personality").classes("col-span-6")
        ui.button("Send to Gemini", on_click=send).classes("col-span-full")

        with ui.card().classes("col-span-full"):
            ui.markdown("## Gemini Response")
            ui.separator()
            ui.label("Send your prompt to Gemini and see the response here.")


ui.run()
{% endhighlight %}

If we now click on "Send to Gemini", we can see our modular created prompt based on Jinja2 templates.

![User interaction]({{site.baseurl}}/images/blog/2024-04-17-08.png)

# Integrate Gemini LLM via VertexAI

Before Gemini via VertexAI can be used, you need a Google Cloud project with VertexAI enabled and a Service Account with sufficient access together with its JSON key file.

![Create project]({{site.baseurl}}/images/blog/2024-04-14-03.png)
*Create project*

After creating a new project, navigate to _APIs & Services_ --> _Enable APIs and service_ --> search for _VertexAI API_ --> _Enable_.

![Enable API]({{site.baseurl}}/images/blog/2024-04-14-04.png)
*Enable API*

To create a Service Account, navigate to _IAM & Admin_ --> _Service Accounts_ --> _Create service account_. Choose a proper name and go to the next step.

![Create Service Account]({{site.baseurl}}/images/blog/2024-04-14-05.png)
*Create Service Account*

Now ensure to assign the account the pre-defined role _Vertex AI User_.

![Assign role]({{site.baseurl}}/images/blog/2024-04-14-06.png)
*Assign role*

Finally you can generate and download the JSON key file by clicking on the new user --> _Keys_ --> _Add Key_ --> _Create new key_ --> _JSON_. With this file, you are good to go.

![Create JSON key file]({{site.baseurl}}/images/blog/2024-04-14-07.png)
*Create JSON key file*

With the JSON credentials key file prepared and stored within the project, we can initialize VertexAI.

{% highlight py %}
credentials = service_account.Credentials.from_service_account_file(
    "gcp-vojay-gemini.json"
)
vertexai.init(project="vojay-329716", location="us-central1", credentials=credentials)
{% endhighlight %}

Now we can load models via VertexAI. In our case, we will go with the Gemini Pro model.

{% highlight py %}
model = GenerativeModel("gemini-pro")
{% endhighlight %}

The model offers a `start_chat` function to start a conversation. It returns a `Chat` object, which has a `send_message` function to send data to Gemini. Here we can also adjust the generation config parameters like `temperature`, but we will go for defaults. Since we stream the reply from Gemini, we will use a helper function to ge the full chat response:

{% highlight py %}
def get_chat_response(chat, prompt):
    text_response = []
    responses = chat.send_message(prompt, stream=True)
    for chunk in responses:
        text_response.append(chunk.text)
    return ''.join(text_response)
{% endhighlight %}

So far, so good. We have a prompt prepared, VertexAI initialized, a helper function to get a chat response, so we can finally integrate Gemini.

We will add a `label` and bind it to a variable in the client storage, which will be used to store and render the Gemini response:

{% highlight py %}
ui.label().bind_text(app.storage.client, "response")
{% endhighlight %}

And with that, we have the first version ready:

{% highlight py %}
import vertexai
from google.oauth2 import service_account
from jinja2 import Environment, PackageLoader, select_autoescape
from nicegui import ui, app
from vertexai.generative_models import GenerativeModel

credentials = service_account.Credentials.from_service_account_file(
    "../gcp-vojay-gemini.json"
)
vertexai.init(project="vojay-329716", location="us-central1", credentials=credentials)

env = Environment(
    loader=PackageLoader("my_gemini_chatbot"),
    autoescape=select_autoescape()
)

model = GenerativeModel("gemini-pro")


def get_chat_response(chat, prompt):
    text_response = []
    responses = chat.send_message(prompt, stream=True)
    for chunk in responses:
        text_response.append(chunk.text)
    return ''.join(text_response)


def get_personality_file(value):
    match value:
        case "Default":
            return "default.jinja"
        case "Santa Claus":
            return "santaclaus.jinja"
        case _:
            return "default.jinja"


def send():
    user_prompt = app.storage.client.get("prompt")
    personality = app.storage.client.get("personality")

    personality_template = env.get_template(get_personality_file(personality))
    prompt_template = env.get_template("prompt.jinja")

    prompt = prompt_template.render(
        prompt=user_prompt,
        personality=personality_template.render()
    )

    ui.notify("Sending to Gemini...", type="info")
    chat = model.start_chat()
    response = get_chat_response(chat, prompt)
    ui.notify("Received response...", type="info")

    app.storage.client["response"] = response


@ui.page('/')
def index():
    with ui.grid(columns=16).classes("w-3/4 place-self-center gap-4"):
        ui.markdown("# 🚀 My Gemini Chatbot").classes("col-span-full")
        ui.input(label="Prompt").bind_value(app.storage.client, "prompt").classes("col-span-10")
        ui.select(
            options=["Default", "Santa Claus"],
            value="Default",
            label="Personality"
        ).bind_value(app.storage.client, "personality").classes("col-span-6")
        ui.button("Send to Gemini", on_click=send).classes("col-span-full")

        with ui.card().classes("col-span-full"):
            ui.markdown("## Gemini Response")
            ui.separator()
            ui.label().bind_text(app.storage.client, "response")


ui.run()
{% endhighlight %}

Let's give it a try with a simple prompt and the default personality:

![Default personality]({{site.baseurl}}/images/blog/2024-04-17-09.png)

Looks ok, but let's add our little twist 🌪️ and see how the Santa Claus personality works:

![Santa Claus personality]({{site.baseurl}}/images/blog/2024-04-17-10.png)

# An AI walks into a bar

Since I became a dad myself, I enjoy the opportunity of throwing in dad jokes whenever possible. With this chapter, I would like to illustrate the benefits of using a modular approach for prompt development with Jinja2 but also of using NiceGUI for simple web UIs.

Let's introduce a new personality. Create a new template file next to the others called: `dadjokes.jinja` and add the following content

{% highlight text %}
You are a proud dad. However, you must add dad jokes to almost every sentence. Add as many dad jokes as possible to your reply and try to make them related to the input. Also, you cant resist and have to add many emojis to your answer.
{% endhighlight %}

To make this work, we just need to extend our helper function `get_personality_file`:

{% highlight py %}
def get_personality_file(value):
    match value:
        case "Default":
            return "default.jinja"
        case "Santa Claus":
            return "santaclaus.jinja"
        case "Dad Jokes":
            return "dadjokes.jinja"
        case _:
            return "default.jinja"
{% endhighlight %}

And add the option to our input element, so that the user can select the new option:

{% highlight py %}
ui.select(
    options=["Default", "Santa Claus", "Dad Jokes"],
    value="Default",
    label="Personality"
).bind_value(app.storage.client, "personality").classes("col-span-6")
{% endhighlight %}

Before we give it a try, let us implement one more thing. Let's introduce a dark mode! With NiceGUI, this is a rather simple task. Via `ui.dark_mode()` we get an object, which offers two functions: `disable` and `enable` to switch the UI modes. Together with our grid approach, we can easily place two buttons next to the "Send to Gemini" button, to switch the UI mode like this:

{% highlight py %}
ui.button("Send to Gemini", on_click=send).classes("col-span-8")

dark = ui.dark_mode()
ui.button("Light UI", on_click=dark.disable).classes("col-span-4")
ui.button("Dark UI", on_click=dark.enable).classes("col-span-4")
{% endhighlight %}

As you can see, the "Send to Gemini" button is not using the class `col-span-full` anymore but `col-span-8` and since we use a grid with 16 columns, we can now add two new buttons next to it with `col-span-4` each.

Putting everything together, this is the extended version of our chatbot:

{% highlight py %}
import vertexai
from google.oauth2 import service_account
from jinja2 import Environment, PackageLoader, select_autoescape
from nicegui import ui, app
from vertexai.generative_models import GenerativeModel

credentials = service_account.Credentials.from_service_account_file(
    "../gcp-vojay-gemini.json"
)
vertexai.init(project="vojay-329716", location="us-central1", credentials=credentials)

env = Environment(
    loader=PackageLoader("my_gemini_chatbot"),
    autoescape=select_autoescape()
)

model = GenerativeModel("gemini-pro")


def get_chat_response(chat, prompt):
    text_response = []
    responses = chat.send_message(prompt, stream=True)
    for chunk in responses:
        text_response.append(chunk.text)
    return ''.join(text_response)


def get_personality_file(value):
    match value:
        case "Default":
            return "default.jinja"
        case "Santa Claus":
            return "santaclaus.jinja"
        case "Dad Jokes":
            return "dadjokes.jinja"
        case _:
            return "default.jinja"


def send():
    user_prompt = app.storage.client.get("prompt")
    personality = app.storage.client.get("personality")

    personality_template = env.get_template(get_personality_file(personality))
    prompt_template = env.get_template("prompt.jinja")

    prompt = prompt_template.render(
        prompt=user_prompt,
        personality=personality_template.render()
    )

    ui.notify("Sending to Gemini...", type="info")
    chat = model.start_chat()
    response = get_chat_response(chat, prompt)
    ui.notify("Received response...", type="info")

    app.storage.client["response"] = response


@ui.page('/')
def index():
    with ui.grid(columns=16).classes("w-3/4 place-self-center gap-4"):
        ui.markdown("# 🚀 My Gemini Chatbot").classes("col-span-full")
        ui.input(label="Prompt").bind_value(app.storage.client, "prompt").classes("col-span-10")
        ui.select(
            options=["Default", "Santa Claus", "Dad Jokes"],
            value="Default",
            label="Personality"
        ).bind_value(app.storage.client, "personality").classes("col-span-6")

        ui.button("Send to Gemini", on_click=send).classes("col-span-8")

        dark = ui.dark_mode()
        ui.button("Light UI", on_click=dark.disable).classes("col-span-4")
        ui.button("Dark UI", on_click=dark.enable).classes("col-span-4")

        with ui.card().classes("col-span-full"):
            ui.markdown("## Gemini Response")
            ui.separator()
            ui.label().bind_text(app.storage.client, "response")


ui.run()
{% endhighlight %}

Now, let's enable dark mode and the Dad Jokes personality to see how Gemini is explaining the term LLM to us:

![Dad Jokes]({{site.baseurl}}/images/blog/2024-04-17-12.png)

As a dad, I approve this 😂.

![Demo]({{site.baseurl}}/images/blog/2024-04-17-13.gif)

# Conclusion

Jokes aside, with this article you learned how to create your own AI chatbot based on the Gemini LLM via VertexAI as well as how to create simple web UIs in Python with NiceGUI. Together with using Jinja2 templating, even this rather short example gave us a modular AI application, which is easy to extend.

With Python, Jinja2, and NiceGUI, you can build a user-friendly interface that interacts with VertexAI's Gemini LLM. This opens doors for various creative applications, from educational chatbots to fun personality-based chat experiences.

I hope this blog post has inspired you to explore the potential of VertexAI and experiment with building your own AI-powered applications.

Enjoy, and what do you call an AI that's bad at following instructions? - A rebel without a clause.
