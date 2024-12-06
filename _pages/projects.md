---
layout: page
title: Projects
permalink: /Projects/
image: '/images/header/projects.webp'
---

This is a curated selection of side projects I've worked on independently, outside of my regular work for personal learning and growth. These projects are the result of my pursuit of learning, knowledge sharing, and participation in hackathons and game jams.

* [Movie Detectives](#movie-detectives)
* [BiaSight](#biasight)
* [Streamlings](#streamlings)

## Movie Detectives

{: .important }
**Award winning project**: this project won at the [Google AI Hackathon 2024](https://googleai.devpost.com/) with more than 15,000 participants.

{: .note }
**Tech stack**: Python, Poetry, Jinja, FastAPI, Pydantic, Docker, Firestore, Firebase, TMDB API, Gemini via Vertex AI, Imagen via Vertex AI, VueJS, Vite, Tailwind CSS, daisyUI

<iframe src="https://www.youtube.com/embed/2Nv0Wz8xwLE" frameborder="0" allowfullscreen></iframe>

Gemini Movie Detectives is an innovative web application using Gemini to create an engaging, AI-driven educational gaming experience. It showcases Gemini's potential in education through four distinct game modes:

- **Title Detectives**: AI-generated movie title riddles from real-time The Movie Database (TMDB) data.
- **Sequel Salad**: Gemini crafts plots for fictional sequels and generates prompts for fake movie posters created by the Google Imagen model.
- **Back to the Future Trivia**: Combining AI with Wikipedia, this mode generates up-to-date multiple-choice questions. Christopher Lloyd would be proud!
- **Movie Fun Facts**: Merging TMDB and Wiki data for accurate trivia content.

All modes use Google's Text-to-Speech API and a modular prompt generation system, allowing users to choose AI personalities, including the hilarious "Dad Jokes Dad"!

Google's AI and developer tools are used for dynamic content generation, nuanced language understanding, and contextual awareness, demonstrating potential for engaging learning apps.

The tech stack, combining FastAPI, VueJS, Firebase for user profiles, metadata, and authentication, and Vertex AI, showcases a scalable approach to AI-powered development.

![System Overview]({{site.baseurl}}/images/projects/movie-detectives-architecture.png)
*System Overview*

Movie Detectives tackles the challenge of maintaining student interest, improving knowledge retention, and making learning enjoyable. It's not just a movie quiz; it’s a glimpse into AI-enhanced education, pushing boundaries for accessible, engaging, and effective learning experiences.

- <a href="https://movie-detectives.com/" target="_blank" class="button">movie-detectives.com</a>
- <a href="https://github.com/vojay-dev/gemini-movie-detectives-api" target="_blank" class="button">GitHub backend</a>
- <a href="https://github.com/vojay-dev/gemini-movie-detectives-ui" target="_blank" class="button">GitHub frontend</a>

![Sequel Salad]({{site.baseurl}}/images/projects/movie-detectives-screen1.png)
*Sequel Salad*

![Personalities]({{site.baseurl}}/images/projects/movie-detectives-screen2.png)
*Personalities*

## BiaSight

{: .note }
**Tech stack**: Python, Poetry, Jinja, FastAPI, Beautiful Soup, Pydantic, Docker, Gemini via Vertex AI, VueJS, Vite, Tailwind CSS, daisyUI

<iframe src="https://www.youtube.com/embed/LJg-o-oH4QU" frameborder="0" allowfullscreen></iframe>

BiaSight is an AI-powered tool that analyzes websites for gender bias, empowering content creators to build more inclusive online spaces. It uses Gemini via Vertex AI to score the categories language, representation, stereotypes, and framing, providing actionable suggestions to improve website content. Think of it as PageSpeed Insights for inclusivity.

![System Overview]({{site.baseurl}}/images/projects/biasight-architecture.png)
*System Overview*

Words matter. In a world where gender inequality persists despite decades of progress, BiaSight addresses one of the most pervasive yet often overlooked aspects of discrimination: the language we use in our digital spaces. BiaSight uses the power of Google's cutting-edge AI, including Gemini, to analyze and improve the inclusivity of online content.

BiaSight empowers content creators to build a more inclusive online world by analyzing websites for gender bias and equity. Simply enter a website URL, and BiaSight, powered by Google Gemini, will deliver a comprehensive report highlighting potential areas for improvement. BiaSight analyzes websites across four key categories:

- **Stereotyping**: Are traditional gender roles being perpetuated? BiaSight examines how genders are portrayed in roles, occupations, behaviors, and characteristics to identify instances where harmful stereotypes may be present.
- **Representation**: Is there a balanced and diverse representation of genders on the webpage? BiaSight considers the frequency of male vs. female mentions, the visibility of women in images, and the inclusion of diverse perspectives and experiences.
- **Language**: Does the language used avoid gender bias? BiaSight detects gendered language, loaded words with stereotypical connotations, and the overall tone towards different genders. The analysis highlights opportunities to use more inclusive language.
- **Framing**: How are gender-related issues presented on the webpage? BiaSight checks for biases in perspective, looking for instances where the framing reinforces existing power structures or minimizes the experiences of any gender.

- <a href="https://biasight.com/" target="_blank" class="button">biasight.com</a>
- <a href="https://github.com/vojay-dev/biasight" target="_blank" class="button">GitHub backend</a>
- <a href="https://github.com/vojay-dev/biasight-ui" target="_blank" class="button">GitHub frontend</a>

![BiaSight Analysis]({{site.baseurl}}/images/projects/biasight-screen1.png)
*BiaSight Analysis*

# Streamlings

{: .note }
**Tech stack**: Godot, Twitch IRC

Do you remember Lemmings? Streamlings takes that beloved concept but adds an exciting twist - Twitch viewers control the characters through chat commands, racing against time to reach their goals. It's classic gameplay meets modern streaming interaction!

Streamlings is an interactive Twitch game that demonstrates the power of Twitch IRC interface integration with the Godot engine, enabling real-time viewer participation. During live streams, viewers can spawn and control their own Streamlings, creating an engaging community experience. The challenge? Work together to guide enough Streamlings safely to their destination in the shortest time possible to claim a spot on the highscore list.

This project showcases how to effectively bridge the gap between Twitch chat and game mechanics, creating an interactive experience that brings streamers and viewers together in real-time gameplay. Whether you're a streamer looking to engage your community or a viewer ready to join the action, Streamlings offers a unique blend of classic gaming nostalgia and modern social interaction.

- Viewers join the stream and interact through chat commands
- Each viewer can spawn and control their own Streamling
- The community works together to navigate obstacles and reach the goal
- Times are recorded and displayed on the leaderboard
- Success requires saving enough Streamlings within the time limit

- <a href="https://vojay.itch.io/streamlings" target="_blank" class="button">Play at itch.io</a>
- <a href="https://github.com/vojay-dev/streamlings" target="_blank" class="button">GitHub</a>

![Streamlings Commands]({{site.baseurl}}/images/projects/streamlings-screen1.png)
*Streamlings Commands*

![Streamlings Gameplay 1]({{site.baseurl}}/images/projects/streamlings-screen2.png)
*Streamlings Gameplay 1*

![Streamlings Gameplay 2]({{site.baseurl}}/images/projects/streamlings-screen3.png)
*Streamlings Gameplay 2*
