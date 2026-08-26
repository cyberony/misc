# Knowledge Graphs

## What is a Knowledge Graph?

A **Knowledge Graph (KG)** is a way to represent information as a network of connected entities. Think of it like a family tree, but for any kind of information—people, places, concepts, events, and how they relate to each other.

## Anatomy of a Knowledge Graph

A knowledge graph consists of three core components:

### 1. **Entities (Nodes)**
   - The "things" in your graph
   - Examples: `Alice`, `Paris`, `The Great Gatsby`, `Python`
   - Represented as circles/boxes in visual diagrams

### 2. **Relationships (Edges)**
   - The connections between entities
   - Examples: `lives_in`, `wrote`, `knows`, `located_in`
   - Represented as arrows/lines connecting nodes

### 3. **Properties (Attributes)**
   - Additional information about entities
   - Examples: `age: 30`, `population: 2.1 million`, `published: 1925`
   - Stored as key-value pairs on entities

## Visual Example

```
    ┌─────────────┐
    │   Alice     │──────────┐
    │  age: 30    │          │ knows
    └──────┬──────┘          │
           │                 │
           │ lives_in        │
           │                 │
    ┌──────▼──────┐    ┌─────▼─────┐
    │   Paris     │    │    Bob    │
    │country:     │    │  age: 28  │
    │  France     │    └─────┬─────┘
    └─────────────┘          │
                             │ lives_in
                             │
                      ┌──────▼──────┐
                      │   London    │
                      │             │
                      └─────────────┘
```

In this example:
- **Entities**: Alice, Paris, Bob, London
- **Relationships**: `lives_in`, `knows`
- **Properties**: `age: 30`, `age: 28`, `country: France`

## A Simple Knowledge Graph Example

Let's build a knowledge graph about a small library system:

### Our Entities and Their Properties:

**Books:**
- `Book1`: title="The Great Gatsby", author="F. Scott Fitzgerald", year=1925
- `Book2`: title="1984", author="George Orwell", year=1949
- `Book3`: title="To Kill a Mockingbird", author="Harper Lee", year=1960

**Authors:**
- `Author1`: name="F. Scott Fitzgerald", born=1896, nationality="American"
- `Author2`: name="George Orwell", born=1903, nationality="British"
- `Author3`: name="Harper Lee", born=1926, nationality="American"

**Genres:**
- `Genre1`: name="Fiction"
- `Genre2`: name="Dystopian Fiction"

### Our Relationships:

- `Book1` ──[written_by]──> `Author1`
- `Book2` ──[written_by]──> `Author2`
- `Book3` ──[written_by]──> `Author3`
- `Book1` ──[has_genre]──> `Genre1`
- `Book2` ──[has_genre]──> `Genre1`
- `Book2` ──[has_genre]──> `Genre2`
- `Book3` ──[has_genre]──> `Genre1`
- `Author1` ──[same_nationality]──> `Author3`

## Representing Knowledge Graphs: RDF Format

Knowledge graphs are often stored using **RDF (Resource Description Framework)**, which uses **triples**:

```
Subject ── Predicate ──> Object
```

Each triple represents one fact. Our library graph in RDF format:

```turtle
# Books
:Book1 :title "The Great Gatsby" .
:Book1 :author "F. Scott Fitzgerald" .
:Book1 :year 1925 .
:Book1 :written_by :Author1 .
:Book1 :has_genre :Genre1 .

:Book2 :title "1984" .
:Book2 :author "George Orwell" .
:Book2 :year 1949 .
:Book2 :written_by :Author2 .
:Book2 :has_genre :Genre1 .
:Book2 :has_genre :Genre2 .

:Book3 :title "To Kill a Mockingbird" .
:Book3 :author "Harper Lee" .
:Book3 :year 1960 .
:Book3 :written_by :Author3 .
:Book3 :has_genre :Genre1 .

# Authors
:Author1 :name "F. Scott Fitzgerald" .
:Author1 :born 1896 .
:Author1 :nationality "American" .
:Author1 :same_nationality :Author3 .

:Author2 :name "George Orwell" .
:Author2 :born 1903 .
:Author2 :nationality "British" .

:Author3 :name "Harper Lee" .
:Author3 :born 1926 .
:Author3 :nationality "American" .
:Author3 :same_nationality :Author1 .

# Genres
:Genre1 :name "Fiction" .
:Genre2 :name "Dystopian Fiction" .
```

## Querying with SPARQL

**SPARQL** (SPARQL Protocol and RDF Query Language) is the SQL for knowledge graphs. It lets you ask questions about your graph.

### Basic SPARQL Pattern

```sparql
SELECT ?variable1 ?variable2
WHERE {
  ?subject :predicate ?object .
  # More patterns...
}
```

### Example Queries

#### 1. Find all books and their authors:

```sparql
SELECT ?book ?title ?authorName
WHERE {
  ?book :title ?title .
  ?book :written_by ?author .
  ?author :name ?authorName .
}
```

**Result:**
| book | title | authorName |
|------|-------|------------|
| Book1 | The Great Gatsby | F. Scott Fitzgerald |
| Book2 | 1984 | George Orwell |
| Book3 | To Kill a Mockingbird | Harper Lee |

#### 2. Find all books published before 1950:

```sparql
SELECT ?book ?title ?year
WHERE {
  ?book :title ?title .
  ?book :year ?year .
  FILTER (?year < 1950)
}
```

**Result:**
| book | title | year |
|------|-------|------|
| Book1 | The Great Gatsby | 1925 |
| Book2 | 1984 | 1949 |

#### 3. Find all American authors:

```sparql
SELECT ?author ?name
WHERE {
  ?author :nationality "American" .
  ?author :name ?name .
}
```

**Result:**
| author | name |
|--------|------|
| Author1 | F. Scott Fitzgerald |
| Author3 | Harper Lee |

#### 4. Find books by American authors:

```sparql
SELECT ?book ?title ?authorName
WHERE {
  ?book :title ?title .
  ?book :written_by ?author .
  ?author :name ?authorName .
  ?author :nationality "American" .
}
```

**Result:**
| book | title | authorName |
|------|-------|------------|
| Book1 | The Great Gatsby | F. Scott Fitzgerald |
| Book3 | To Kill a Mockingbird | Harper Lee |

#### 5. Find all genres for "1984":

```sparql
SELECT ?genre ?genreName
WHERE {
  ?book :title "1984" .
  ?book :has_genre ?genre .
  ?genre :name ?genreName .
}
```

**Result:**
| genre | genreName |
|-------|-----------|
| Genre1 | Fiction |
| Genre2 | Dystopian Fiction |

## Key Takeaways

1. **Knowledge graphs = Entities + Relationships + Properties**
2. **RDF triples** represent facts as `Subject ── Predicate ──> Object`
3. **SPARQL** queries let you ask questions about the graph
4. **Variables** (starting with `?`) in SPARQL are like placeholders you're trying to find
5. **Patterns** in the WHERE clause describe what you're looking for

## Why Knowledge Graphs?

- **Flexible**: Easy to add new information without restructuring
- **Connected**: Relationships are first-class citizens
- **Queryable**: Powerful query languages like SPARQL
- **Semantic**: Meaning is encoded in the structure itself

---

*This tutorial covers the essentials. Knowledge graphs power search engines, recommendation systems, and AI applications by making relationships between data explicit and queryable.*
