Here I'm going to write a quick explanation of the systems the site uses.
Writing it in english because I feel like it. Hope that's fine!
Now, to the explanation.

- ENTRIES and CATEGORIES -

This system handles the dynamic pages, separated into three types: Entries, Categories and Static pages.

Entries are written pages with proper content, like a wikipedia page. It uses markdown (.md) files to store string data
alongside properties for the site. content/index.json is essentially a list of all these entries.
Currently, I believe it may be wise to rework part of it, as it unneccessarily stores extra copies of each entry's data 
both inside the markdowns and inside index.json. 

Categories are a little more simple. All entries have categories listed, which is used by the category handler to find and 
show all entries under the category on one page. 
It does this by reading through index.json to find items under the requested category.



javascript/build-index.js
Upon running this script in the folder on a personal computer, it will automatically update index.json.
As of now, the script does not automatically detect new categories or static pages.

javascript/sitescripts/entry.js
Simply put, this script handles


javascript/sitescripts/category.js
javascript/sitescripts/searchEngine.js
javascript/sitescripts/searchUI.js
javascript/clientside/link_autosave.js
javascript/sitescripts/pop_list.js



COMMANDS (cmd)-- Don't worry about this, this is just in case I forget how to test
'node javascript/build-index.js' - Auto generate index.json

reminder to myself to use 'npx serve . -c serve.json' to run a server locally for testing