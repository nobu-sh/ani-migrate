ani-migrate
===========
ani-migrate is a PostgreSQL migration package that allows for versioning to keep all database migrations clean and mess free!

This package is highly based off of [pg-migrator](https://github.com/Aphel-Cloud-Solutions/pg-migrator/) with some enhancements.

## Features
  * Forward and backwards migrations
  * Migration to a specifc version
  * Sub folder deep search
  * Transactional migration
  * No remote session required
  * Optional schema based versioning

## Installation

```
npm install -g @animiru/ani-migrate
```

## Quick Start
To keep things a little more organized *ani-migrate* requires there to be a dedicated directory for migrations. This directory can be named anything the only rule is it contains a file named `.ani-migrate`.

We will talk more about `.ani-migrate` later.


`Example Hierarchy`

```
project
  ├─ migrations
  │   ├─ .ani-migrate
  │   ├─ 1-2.sql
  │   ├─ 2-1.sql
  │   └─ ...
  ├─ src
  │   ├─ index.js
  │   └─ ...
  └─ package.json
```
Now with a migrations directory we can use the following command to migrate to the highest migration in our directory.

```
ani-migrate postgres://username:pass@host/somedb
```

## More In Depth
As seen in the basic usage it is pretty simple to get started but we also offer some more in depth features.
### Hierarchy
Above you saw an example hierarchy we provided. Well `ani-migrate` actually provides a deep sub folder search. Therefore you can organize your migrations directory however you please.

`Advanced Hierarchy`

```
project
  ├─ migrations
  │   ├─ .ani-migrate
  │   ├─ v1.0.0
  │   │   ├─ 1-2.sql
  │   │   ├─ 2-1.sql
  │   │   ├─ 2-3.sql
  │   │   └─ 3-2.sql
  │   ├─ v2.0.0
  │   │   ├─ 3-4.sql
  │   │   └─ 4-3.sql
  │   └─ ...
  ├─ src
  │   ├─ index.js
  │   └─ ...
  └─ package.json
```
Something as advanced as this would be 100% valid not to mention you can have sub folders inside of your sub folders to the power of infinity.

### Steps
Another concern or issue you may have from above is  "what if I want to migrate backwards?" or "what if a want to migrate 5 steps forward?". Well we have you 100% covered.

<br>

```
ani-migrate postgres://username:pass@host/somedb +1
```
> Migrate up 1 step
```
ani-migrate postgres://username:pass@host/somedb -1
```
> Migrate down 1 step
```
ani-migrate postgres://username:pass@host/somedb -5
```
> Migrate to back 5 versions
```
ani-migrate postgres://username:pass@host/somedb 5
```
> Migrate to migration 4-5.sql

### `.ani-migrate`
This file is not as cool as it seems. It is used to config schema based migrations.

`Example .ani-migrate`
```
# ani-migrate config
```
As stated above, its not that interesting. It  mainly stands as a landmark for what directory contains migrations and config for schema based migrations.

## Migration Scripts
ani-migrate will utilize all migrations scripts located anywhere withing the migration folder that follow the format `x-y.sql` (case insensitive).

As stated above the migration scripts can be organized and categorized however you wish. ani-migrate will search all sub folders and sub folders of sub folders to the power of infinity.

`Sample Migration Names`
```
17-18.sql : Migrations script from version 17 to version 18 for forward migration
18-17.sql : Migration script from version 18 to version 17 for backwards migration
```
### NOTE
Your first migration needs to be `1-2.sql` we do not start at 0!

## Per Schema Migrations
Per schema migrations is one of the more interesting parts of this package.

A use case of this would be say you have two sub projects under one main project that need to access each others tables. Rather than creating two seperate databases and having two seperate connection. We can use schema based migrations to utilize the same database for multiple projects using migrations.

This may sound quite confusing so lets put it into example.

### Project A
In project a we will have a service that constantly monitors youtube for new uploads and stores their links.

`Hierarchy`

```
yt-watcher
  ├─ migrations
  │   ├─ .ani-migrate
  │   ├─ 1-2.sql
  │   ├─ 2-1.sql
  │   └─ ...
  ├─ src
  │   ├─ index.js
  │   └─ ...
  └─ package.json
```

`.ani-migrate`
```
# ani-migrate config

schema=youtube
```

`1-2.sql`
```sql
CREATE SCHEMA IF NOT EXISTS youtube;

SET search_path TO youtube, public;

CREATE TABLE IF NOT EXISTS youtube.new_upload (
  "url": text NOT NULL,
  "uploaded" timestamp NOT NULL
);
```

`2-1.sql`
```sql
DROP SCHEMA IF EXISTS youtube CASCADE;
```

```
ani-migrate postgres://username:pass@host/testdb
```

`Project A` now has a config setup to tell `ani-migrate` to store the versioning table under the youtube schema and only version migrations for the youtube schema nothing else.

### Project B
In this project we are reading the uploaded videos from teh database but we also need to store user info for people who login on our site.

`Hierarchy`

```
website
  ├─ migrations
  │   ├─ .ani-migrate
  │   ├─ 1-2.sql
  │   ├─ 2-1.sql
  │   └─ ...
  ├─ src
  │   ├─ index.js
  │   └─ ...
  └─ package.json
```

`.ani-migrate`
```
# ani-migrate config

schema=website
```

`1-2.sql`
```sql
CREATE SCHEMA IF NOT EXISTS website;

SET search_path TO website, public;

CREATE TABLE IF NOT EXISTS website.users (
  "username": varchar(32) NOT NULL,
  "password" varchar(64) NOT NULL
);
```

`2-1.sql`
```sql
DROP SCHEMA IF EXISTS website CASCADE;
```
```
ani-migrate postgres://username:pass@host/testdb
```

Now `Project B` also has its own table under the schema `website` on the same database `testdb` so we can have 1 connection to read youtube episodes and user info. 

### In Conclusion

Since we told `ani-migrate` in the config for each project to only utilize a specific schema, neither of the migrations will conflict.

## [Examples](./examples)