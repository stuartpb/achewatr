# achewatr #

A site presenting all Achewood strips, columns, and blogs in one clean, unified context.

Note that **this is the project's only documentation**: the `docs` directory is only so named so that GitHub may serve static assets from it via GitHub Pages, for when the site is down.

## Setting up

Install the devDependencies, then run setup.js with the `mongodb://` URL of your database as the first command line argument to the script.

Note that large clusters of insertions to MongoLab databases have a tendency to fail by timing out, so you may want to do the insertions to a locally-running database, dump/export the `items` collection from the local, then restore/import the dump to the remote server.

You can also just produce the JSON that would be exported (allowing you to skip the local server and export steps) by running setup.js with `--method export` and the desired filename instead of the server URL.

## Testing

Run `mocha`.

## Database layout

### items

Collection of strips, blog entries, and columns- everything that appears in the sequence.

### _id

The ID of an item is the URL of the original page it's derived from.

#### published

Date the item was published (as a Date).

#### title

Title of the strip / column / blog post. Note that this can be empty, as in the case of Chris' [December 2011 blog post](http://chrisonstad.blogspot.com/2011/12/normal-0-false-false-false-en-us-x-none.html).

#### type

Type of this item: Achewood strip, Ray's Place column, or blog post.

The other fields present depend on this type:

##### 'achewood'

- mdydate: the month, day, and year of the comic's posting, as used in the original URL.

Each of these will only be present if set (non-empty) on the original page:

- header: Header text above the comic.
- href: The target of the comic's link wrapper.
- alt: The content of the title attribute of the comic image (colloquially, the "alt text").

##### 'raysplace'

- mdydate: the month, day, and year of the column's posting, as used in the original URL.
- content: The HTML content of the column, from date down.

##### 'blog'

- blog: Which blog (by domain) this post comes from.
- path: The path to the post (without the .html extension).
- content: The HTML content of the post.

Additional, possible field:

- author: The name of the author of the post, if not 'me' (there are a few times it's "Peter H. Cropes").
