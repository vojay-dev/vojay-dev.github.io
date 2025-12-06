---
layout: post
title: From Scrolls to Similarity Search - Building a Movie Recommender with DuckDB VSS
description: Learn how to use DuckDB's Vector Similarity Search extension to create a recommendation engine using semantic search and Gemini embeddings
date: 2024-11-29 09:00:00 +0300
image: '/images/blog/2024-11-29.jpg'
tags: [data-engineering, duckdb, python, similarity-search, rag, recommendation-system, gemini, vertex-ai]
toc: true
---

# From Ancient Scrolls to Digital Movies

You're standing in Ancient Egypt, around 250 years before the start of our modern calendar. As your eyes adjust to the warm light shining through high windows, you find yourself in the [Great Library of Alexandria](https://en.wikipedia.org/wiki/Library_of_Alexandria){:target="_blank"}. What you see is overwhelming: shelves stretch in every direction, holding nearly half a million scrolls. The air is thick with the scent of papyrus and you're searching for writings about astronomy. You hear the quite rustling of [Callimachus](https://dcc.dickinson.edu/callimachus-aetia/callimachus){:target="_blank"}, the library's most celebrated scholar, working on the solution for your problem.

He revolutionized information retrieval by creating the [Pinakes](https://en.wikipedia.org/wiki/Pinakes){:target="_blank"} - the world's first library catalog. Instead of organizing scrolls merely by author or title, he pioneered a system that **categorized works by their subject matter and content, enabling scholars to discover [related works](https://www.magellantv.com/articles/the-long-strange-story-of-search-from-ancient-scrolls-to-digital-books){:target="_blank"}** they might never have found through simple alphabetical browsing.

![Illustration of Callimachus]({{site.baseurl}}/images/blog/2024-11-29-01.png)
*Illustration of Callimachus, source: generated with DALL-E 3*

Over 2,000 years later, we face a similar challenge. In the digital archives of Netflix's early days, engineers worked on their own Alexandria-scale problem. Their movie recommendation system, built on simple rating matches, struggled to capture the essence of what makes films truly similar. A comedy about a wedding might share more DNA with a romantic drama than another comedy about sports, yet traditional categorization methods - much like organizing scrolls by their physical attributes - missed these subtle connections. This challenge of **semantic understanding** - capturing the true meaning and similarity between items - remains at the heart of modern search and recommendation systems.

Today, we stand at an interesting crossroad. The evolution of vector search solutions, due to their prominent use in Retrieval-Augmented Generation (RAG) systems, promises to solve these semantic matching problems, but with a catch: most solutions demand complex infrastructure, significant resources, and careful maintenance. However, for some cases, there is a pragmatic answer to this complexity: [DuckDB's Vector Similarity Search (VSS) extension](https://duckdb.org/docs/extensions/vss.html){:target="_blank"}.

In this guide, we'll build a movie recommendation engine that could have solved Netflix's early challenges, using modern tools that fit in your laptop's memory. By combining DuckDB's VSS extension with Gemini's embedding capabilities, we'll create a system that understands the essence of movies, not just their metadata. Whether you're building the next big recommendation engine or simply want to understand vector search better, this practical journey will equip you with the knowledge to tackle semantic search challenges in your own projects.

# Text to Numbers: Understanding Embeddings

Before we dive into similarity search, let's understand how we convert movie descriptions into numbers that computers can understand. This is where embeddings come in.

Embeddings work by converting text, image, and video into arrays of floating point numbers, called vectors. These vectors are designed to capture the meaning of the text, images, and videos. The length of the embedding array is called the vector's dimensionality. For example, one passage of text might be represented by a vector containing hundreds of dimensions.

# Vector Similarity Search

Once we have these numerical vectors, we need ways to measure how close or similar they are.

DuckDB introduced the _ARRAY_ data type in v0.10.0, which stores fixed-sized lists, to complement the variable-size _LIST_ data type.

They also added a couple of distance metric functions for this new _ARRAY_ type: [array_distance](https://duckdb.org/docs/sql/functions/array.html#array_distancearray1-array2){:target="_blank"}, [array_negative_inner_product](https://duckdb.org/docs/sql/functions/array.html#array_negative_inner_productarray1-array2){:target="_blank"} and [array_cosine_distance](https://duckdb.org/docs/sql/functions/array.html#array_cosine_distancearray1-array2){:target="_blank"}. With these distance functions, similarity can be measured:

![Euclidean Distance]({{site.baseurl}}/images/blog/2024-11-29-02.png)
*Euclidean Distance, source: by author*

![Cosine Distance]({{site.baseurl}}/images/blog/2024-11-29-03.png)
*Cosine Distance, source: by author*

DuckDB's VSS extension then added support for Hierarchical Navigable Small Worlds (HNSW) indexes to accelerate vector similarity search.

# HNSW: Understanding the Small World Network

Let's get an idea how the HNSW index works. Imagine you're in New York City trying to find a World of Warcraft player who also teaches quantum physics. Here's how different search approaches would work:

## Strategy 1: Brute Force

Stop every single person in NYC and ask if they match your criteria.
- Time: Months
- Accuracy: 100%
- Efficiency: Checking millions unnecessarily

## Strategy 2: HNSW (Smart Hierarchical Search)

Think of it like a cleverly organized social network with different levels of connection:

**Level 3 (Top Level) - Global Connections**
- Like knowing the leaders of major gaming communities and university physics departments
- Quick, broad reach: "Here are the main institutions and gaming hubs to check"

**Level 2 (Mid Level) - District Connections**
- Like knowing local WoW guild leaders and physics department heads
- More focused: "These three physics departments have active gaming communities"

**Level 1 (Ground Level) - Local Connections**
- Direct knowledge of individual gamers and professors
- Precise matching of candidates

![HNSW visualization]({{site.baseurl}}/images/blog/2024-11-29-04.png)
*HNSW visualization, source: generated with DALL-E 3*

The search starts at the top level, quickly identifies promising areas, and drills down efficiently. For 1 million candidates, you'll check about 20 instead of all million, while maintaining 95–99% accuracy.

# Building a Movie Recommender

## Prerequisites
- Python 3.12
- Required packages: `duckdb ≥ 1.1.3`, `httpx`, `google-cloud-aiplatform`
- [The Movie Database (TMDB) API key for movie data](https://developer.themoviedb.org/docs/getting-started){:target="_blank"}
- Google Cloud Platform (GCP) service account with Vertex AI enabled

## Setup

{% highlight py %}
from typing import List, Dict
import duckdb
import httpx
from google.cloud import aiplatform
from vertexai.language_models import TextEmbeddingModel

tmdb_api_key: str = 'your-tmdb-api-key'
credentials = service_account.Credentials.from_service_account_file('your-sa.json')
aiplatform.init(project='your-project', location='us-central1', credentials=credentials)
{% endhighlight %}

## Fetch Movie Data

We fetch movie data from the TMDB API using `httpx`. Also, we allow to specify a minimum average voting score and count, to reduce the dataset to more famous movies.

{% highlight py %}
def _get_movies(page: int, vote_avg_min: float, vote_count_min: float) -> List[Dict]:
    """ Fetch movies from TMDB API """
    response = httpx.get('https://api.themoviedb.org/3/discover/movie', headers={
        'Authorization': f'Bearer {tmdb_api_key}'
    }, params={
        'sort_by': 'popularity.desc',
        'include_adult': 'false',
        'include_video': 'false',
        'language': 'en-US',
        'with_original_language': 'en',
        'vote_average.gte': vote_avg_min,
        'vote_count.gte': vote_count_min,
        'page': page
    })
    response.raise_for_status()  # Raise an error for bad responses
    return response.json()['results']

def get_movies(pages: int, vote_avg_min: float, vote_count_min: float) -> List[Dict]:
    """ Generator to yield movie data from multiple pages """
    for page in range(1, pages + 1):
        yield from _get_movies(page, vote_avg_min, vote_count_min)
{% endhighlight %}

## Generate Embeddings

We use Gemini's `text-embedding-004` model to generate embeddings and set the vector dimensionality to 256.

_Note: The dimension size (256) must match in both embedding generation and DuckDB table creation._

{% highlight py %}
def embed_text(texts: List[str]) -> List[List[float]]:
    """ Generate embeddings for a list of texts using Gemini """
    model = TextEmbeddingModel.from_pretrained('text-embedding-004')
    inputs = [TextEmbeddingInput(text, 'RETRIEVAL_DOCUMENT') for text in texts]
    embeddings = model.get_embeddings(inputs, output_dimensionality=256)
    return [embedding.values for embedding in embeddings]

# Fetch movies from TMDB API and generate embeddings
movie_data = list(get_movies(3, 6.0, 1000))
movies_for_embedding = [(movie['id'], movie['title'], movie['overview']) for movie in movie_data]
embeddings = embed_text([overview for _, _, overview in movies_for_embedding])
{% endhighlight %}

## DuckDB VSS Setup

As a next step, we install and load the VSS extension in DuckDB, and enable persistence. This allows us to store the embeddings in a database file.

{% highlight sql %}
INSTALL vss;
LOAD vss;
SET hnsw_enable_experimental_persistence = true;
{% endhighlight %}

We then create the table, using the same dimensionality as before.

{% highlight sql %}
CREATE TABLE movies_vectors (
    id INTEGER,
    title VARCHAR,
    vector FLOAT[256]
)
{% endhighlight %}

After inserting the embeddings, we create a HNSW index on the vector column in order to speed up vector similarity search.

{% highlight sql %}
CREATE INDEX movies_vector_index ON movies_vectors USING HNSW (vector)
{% endhighlight %}

We then prepare a function, that takes a movie description as input. This is the search query from the user. We also create an embedding vector based on this input. Finally, we use a DuckDB distance function to get similar movies.

{% highlight sql %}
SELECT title
FROM movies_vectors
ORDER BY array_distance(vector, array[{vector_array}]::FLOAT[256])
LIMIT 3
{% endhighlight %}

With that, this is how the DuckDB VSS setup looks like:

{% highlight py %}
# Set up DuckDB with Vector Similarity Search (VSS) Extension and persistence enabled
# See: https://duckdb.org/docs/extensions/vss.html
with duckdb.connect(database='movies.duckdb') as conn:
    conn.execute("""
        INSTALL vss;
        LOAD vss;
        SET hnsw_enable_experimental_persistence = true;
    """)

    conn.execute("""
        CREATE TABLE movies_vectors (
            id INTEGER,
            title VARCHAR,
            vector FLOAT[256]
        )
    """)

    # Insert embeddings into DuckDB
    conn.executemany("INSERT INTO movies_vectors VALUES (?, ?, ?)", [
        (movies_for_embedding[idx][0], movies_for_embedding[idx][1], embedding)
        for idx, embedding in enumerate(embeddings) if len(embedding) == 256
    ])

    # Create Hierarchical Navigable Small Worlds (HNSW) Index
    conn.execute("CREATE INDEX movies_vector_index ON movies_vectors USING HNSW (vector)")

    def search_similar_movies(query: str):
        """ Search for movies similar to the given query description """
        query_vector = embed_text([query])

        vector_array = ', '.join(str(num) for num in query_vector[0])

        query = conn.sql(f"""
            SELECT title
            FROM movies_vectors
            ORDER BY array_distance(vector, array[{vector_array}]::FLOAT[256])
            LIMIT 3
        """)

        print(query.explain())  # Print the query plan to show the HNSW_INDEX_SCAN node
        return query.fetchall()
{% endhighlight %}

We are not only returning the similarity search result, but also print the query plan with `query.explain()` to show that the HNSW index is actually used.

# Using the Recommender

Putting everything together, this is the full example:

{% highlight py %}
from typing import List, Dict
import duckdb
import httpx
from google.cloud import aiplatform
from google.oauth2 import service_account
from google.oauth2.service_account import Credentials
from vertexai.language_models import TextEmbeddingModel, TextEmbeddingInput

tmdb_api_key: str = 'your-tmdb-api-key'
credentials = service_account.Credentials.from_service_account_file('your-sa.json')
aiplatform.init(project='your-project', location='us-central1', credentials=credentials)

def _get_movies(page: int, vote_avg_min: float, vote_count_min: float) -> List[Dict]:
    """ Fetch movies from TMDB API """
    response = httpx.get('https://api.themoviedb.org/3/discover/movie', headers={
        'Authorization': f'Bearer {tmdb_api_key}'
    }, params={
        'sort_by': 'popularity.desc',
        'include_adult': 'false',
        'include_video': 'false',
        'language': 'en-US',
        'with_original_language': 'en',
        'vote_average.gte': vote_avg_min,
        'vote_count.gte': vote_count_min,
        'page': page
    })
    response.raise_for_status()  # Raise an error for bad responses
    return response.json()['results']

def get_movies(pages: int, vote_avg_min: float, vote_count_min: float) -> List[Dict]:
    """ Generator to yield movie data from multiple pages """
    for page in range(1, pages + 1):
        yield from _get_movies(page, vote_avg_min, vote_count_min)

def embed_text(texts: List[str]) -> List[List[float]]:
    """ Generate embeddings for a list of texts using Gemini """
    model = TextEmbeddingModel.from_pretrained('text-embedding-004')
    inputs = [TextEmbeddingInput(text, 'RETRIEVAL_DOCUMENT') for text in texts]
    embeddings = model.get_embeddings(inputs, output_dimensionality=256)
    return [embedding.values for embedding in embeddings]

# Fetch movies from TMDB API and generate embeddings
movie_data = list(get_movies(3, 6.0, 1000))
movies_for_embedding = [(movie['id'], movie['title'], movie['overview']) for movie in movie_data]
embeddings = embed_text([overview for _, _, overview in movies_for_embedding])

# Set up DuckDB with Vector Similarity Search (VSS) Extension and persistence enabled
# See: https://duckdb.org/docs/extensions/vss.html
with duckdb.connect(database='movies.duckdb') as conn:
    conn.execute("""
        INSTALL vss;
        LOAD vss;
        SET hnsw_enable_experimental_persistence = true;
    """)

    conn.execute("""
        CREATE TABLE movies_vectors (
            id INTEGER,
            title VARCHAR,
            vector FLOAT[256]
        )
    """)

    # Insert embeddings into DuckDB
    conn.executemany("INSERT INTO movies_vectors VALUES (?, ?, ?)", [
        (movies_for_embedding[idx][0], movies_for_embedding[idx][1], embedding)
        for idx, embedding in enumerate(embeddings) if len(embedding) == 256
    ])

    # Create Hierarchical Navigable Small Worlds (HNSW) Index
    conn.execute("CREATE INDEX movies_vector_index ON movies_vectors USING HNSW (vector)")

    def search_similar_movies(query: str):
        """ Search for movies similar to the given query description """
        query_vector = embed_text([query])

        vector_array = ', '.join(str(num) for num in query_vector[0])

        query = conn.sql(f"""
            SELECT title
            FROM movies_vectors
            ORDER BY array_distance(vector, array[{vector_array}]::FLOAT[256])
            LIMIT 3
        """)

        print(query.explain())  # Print the query plan to show the HNSW_INDEX_SCAN node
        return query.fetchall()

    # Example Search
    query_description = 'Movie with an action hero who drives fast cars'
    similar_movies = search_similar_movies(query_description)

    # Display results
    print(f"Movies similar to your query: '{query_description}':")
    for movie in similar_movies:
        print(f"Title: {movie[0]}")
{% endhighlight %}

You can search for similar movies using natural language descriptions. For example:

{% highlight py %}
query_description = 'Movie with an action hero who drives fast cars'
similar_movies = search_similar_movies(query_description)
{% endhighlight %}

The system will:
1. Convert your description to a 256-dimensional vector
2. Use the HNSW index to efficiently find similar movies
3. Return the top 3 closest matches

![Movie Recommender demo]({{site.baseurl}}/images/blog/2024-11-29-05.png)
*Movie Recommender demo, source: by author*

# Conclusion

Remember Callimachus and his Pinakes - sometimes the most elegant solutions are also the simplest. Often the tech industry's answer to every problem is _add more infrastructure_. DuckDB VSS reminds us of a timeless truth: you don't always need distributed systems to solve challenges effectively. Just as the ancient librarian created a groundbreaking system with fundamental principles, we too can tackle modern recommendation challenges with straightforward, efficient tools that get the job done.

Whether you're building a movie recommendation engine or tackling other semantic search challenges, the principles and techniques demonstrated here provide a solid foundation for your projects. The power of vector similarity search, combined with the simplicity of DuckDB, opens up new possibilities for creating sophisticated search and recommendation systems or Retrieval-augmented generation (RAG) systems without the complexity of distributed architectures.
