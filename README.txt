Here I'm going to write a quick explanation of the systems the site uses.
I'll be writing it in english because I feel like it. Hope that's fine!

The reason I'm documenting it here instead of commenting on the scripts themselves is because they are very long, 
and commenting all of it properly would take a while.

Now, to the explanation.

- ENTRIES and CATEGORIES -

This system handles dynamic and non dynamic pages, separated into three types: Entries, Categories and Static pages.
Dynamic pages are handled using a query string at the end of the link (?slug=) to specify which dynamic page is currently loaded.
Essentially, each type of dynamic page has one template file that it fills with content from elsewhere.


Entries are written pages with proper content, like a wikipedia page. It uses markdown (.md) files to store string data
alongside properties for the site. content/index.json is essentially a list of all these entries.
The site has a built in page editor you can try out, which lets you export your work as a markdown. I'm currently working on
letting you import a markdown and letting you edit a page already on the site.
As well, if you're trying to build this yourself in an offline folder, there's a script to automatically update index.json
with all markdowns inside content/
Entry links look like this: 
/entry.html?slug=[ENTRY IDENTIFIER]


Categories are a little more simple. All entries have categories listed, which is used by the category handler to find and 
show all entries under the category on one page. 
It does this by reading through index.json to find items under the requested category.
Categories use the exact same system as Entries, however Category links look like this:
/category.html?category=[CATEGORY IDENTIFIER]
They have to look different to make sure the system never confuses a Category for an Entry.


Static pages are just pages that have their entire own file, like for example index.html, the home page.
They are listed in content/static_index.json



Below are all the scripts explained:

- javascript/build-index.js
Upon running this script in the folder on a personal computer, it will automatically update index.json to include any new markdowns
inside content/ as well as updating any of the already existing listed pages if there are changes. As well, it also checks each 
markdown's last updated date, and if it doesn't match with the one currently set inside the file itself, it will update it.
As of now, the script does not automatically detect new categories or static pages.

- javascript/sitescripts/entry.js
Simply put, this script handles inserting Entry content. It checks the link for a query string like '?slug=' and uses the following
string to check index.json. Then it finds the page matching the identifier and loads the associated markdown file.
It then reads and parses the markdown, splitting it into three parts: Frontmatter, Middlematter and Footer.
Frontmatter and Footer are part of usual markdowns, however I decided to add Middlematter to sort the file a little better.


Frontmatter: Contains simple information, like strings linked to a variable. 
The title of the page (shown on the website), the identifier of the page (the 'slug'), the list of categories the entry is under,
a short summary of the page (currently unused) and the automatic last updated date are all stored here.

Middlematter: Essentially just contains JSON-esque lists. 
Contains the list of images for the gallery (specifies link and name) and also stores attributes.

Footer: Contains the actual page content itself, as in the writing on the page.


For a better understanding of the layout of the markdowns, look at 'templates/MDT for others.md', 
and look at any markdown inside content/ to see and compare how the content is inserted into the page. 
Feel free to use the entry editor on the website as well.

- javascript/sitescripts/category.js
The Category counterpart to entry.js. 
As explained earlier, it first uses the query link '?category=' to identify which category is currently being viewed. 
Then it looks at content/categories.json for the category, which contains the proper title of the category along with a description.
Then looks through index.json to look for entries with that category listed, before grabbing the title and first gallery image
to display it on the page. Honestly a lot more simple than Entries.

- javascript/sitescripts/searchEngine.js
The first part to the search bar subsystem. 
This script is quite short, but essentially it reads the three JSONs (index.json, categories.json and static_index.json) and
creates three sorted arrays of their titles and identifiers (in the case of static pages it simply stores the HTML location), 
which are later used by the rest of the search system.

It also handles the actual searching.
Essentially, the searching works by sorting down to the closest result and results which contain the user input anywhere in the 
length of the string, and of course it sorts all of it alphabetically.

- javascript/sitescripts/searchUI.js
The second part to the search bar subsystem.
Handles actually displaying the arrays given by searchEngine.js, as well as handling everything else visual about the search bar.
More specifically, it handles stuff like resizing the result box, creating page type labels in the results list along with most
input related code like pressing enter or the search button to go to the top result on the list without having to click it.

- javascript/clientside/link_autosave.js
Makes sure that links containing query strings are stored and not forgotten. Not entirely necessary, but good to have just in case.
It does this by both saving the last query string in local storage, and also separating category and entry query strings.

- javascript/sitescripts/pop_list.js
This is barely connected to the system, however it does search index.json for identifiers.
It uses that to check an external storage on Cloudflare to see how many total visits each page has, showing the top 3 most visited
on the home page.

- javascript/pagevisits.js
Checks if the user in their current session has visited the current page. In the case of a dynamic page, it checks if
the user has visited the current query string. If they haven't (each page starts out as not visited) the script will add 1 to that
page's visits counter on the Cloudflare storage before marking the page as visited in session storage.




- ACCOUNTS and SETTINGS -

I recently implemented this crude system to allow for people to create their own accounts on the system, and even more recently
added a proper settings system that let people set their preferences.

Using Firebase (firebase authentication to be more specific) the site lets a user create an account, storing the account in a list
separately from the website. 
To create an account, a password and an email account must be given. 
This creates a new item in Firebase's list of accounts for the website.
Additionally, Firebase allows adding custom attributes for accounts, which I for now used to create two attributes:
Username and Profile picture.

Username is just the display name for the account on the website.
Profile picture, however, is a bit more complicated. Due to proper Firebase storage being a paid subscription, I decided to
implement profile pictures differently.
The website compresses the user's chosen picture, both with jPEG compression and pixelation/resolution reducing.
Then, it converts the compressed image to a hex string, which is barely small enough to store as an attribute because 
Firebase has a maximum attribute size.

I've yet to find out if this size cap applies only to each individual attribute or if it applies to the account itself.
If the size cap is for all attributes combined, I may have to either compress the image further or simply remove profile pictures.

The storage isn't actually a JSON or a file in that sense, but the structure is similar. 
If it were a JSON it would look like this:

{
    "example.person@gmail.com": {
        "password": "123456",
        "username": "Example Person",
        "profilepicture": "87414872317203009"
    }
}


This leads me into the second part of this system, Settings.
It is pretty unfinished, but I'll explain what is finished so far and where I plan to take it in the future.

The settings system currently consists of three features: The settings page, Setting functionality and Dynamic setting creation.

The settings page is essentially the menu with the UI interaction necessary to actually change the values of settings.
It consists of these scripts:
javascript/settings/settings_UI.js
javascript/settings/settings_registry.js






- THE GAME -
In the game I made, to be completely honest, I forgot entirely to actually add something to happen when you lose.
To check when you actually lose, just do inspect and check the console. 
It should notify you when you lose the game (aka when you hit an obstacle.)


- SCRIPTS YOU SHOULD IGNORE -

There are some scripts that are either unfinished, unused or simply unimportant. Here's a quick list of them:

javascript/fullscreen.js -- script i tried making to force fullscreen
javascript/fps.js -- debug fps logger
javascript/cursor.js -- scrapped custom cursor functionality
javascript/sitescripts/background.js -- just a parallax effect for the background of the site
javascript/clientside/gamestate.js -- stores information locally in __window.gamestate, made irrelevant by accounts
javascript/effects -- text effects that are currently not properly implemented


- COMMANDS (cmd) - 
Don't worry about this, this is just in case I forget how to test stuff locally

'node javascript/build-index.js' - Auto generate index.json

reminder to myself to use 'npx serve . -c serve.json' to run a server locally for testing