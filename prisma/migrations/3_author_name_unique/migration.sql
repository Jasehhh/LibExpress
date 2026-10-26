-- Each author name is used once, ignoring case. The API checks this first;
-- the index stops two requests that add the same name at once. It fails if
-- the table already holds a duplicate, so merge those before deploying.
CREATE UNIQUE INDEX "author_name_key" ON "author"(lower("first_name"), lower("last_name"));
