## FAQ

### Why do you have all these dependencies that you're only using for setup? Shouldn't you be listing them as devDependencies or something like that?

They'll be runtime dependencies if/when the functionality to update the database in the event Achewood gets updated (fingers crossed) gets introduced.

## Database collections

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
