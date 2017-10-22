# Dialog tree creator

Allows you to easily organize your in-game dialogs into easily readable tree and then export them using JSON

![Screenshot](https://user-images.githubusercontent.com/15877754/31861673-a40d5860-b731-11e7-8df8-e11481b8d9a5.png)

This example produces `{"0":{"title":"Mr. A","text":"Hello! How can I help?","options":[{"title":"Who are you?","link":4},{"title":"How old are you?","link":6},{"title":"Leave"}]},"4":{"title":"Mr. A","text":"My name is not important.","options":[{"title":"Sure."},{"title":"I think it is."}]},"6":{"title":"Mr. A","text":"45. And you?","options":[{"title":"21","link":10},{"title":"11","link":11}]},"10":{"title":"You","text":"I am 21.","options":[]},"11":{"title":"You","text":"My mom told me not to tell my age to the strangers.","options":[]}}` as a result

## How it works

The dialog tree consists of **Frame**s and **Option**s. Every dialog tree must have at least only one frame - the root frame with index 0.

Frame can have unlimited options which users selects. Every option can have up to one Frame linked.

## Result format

Result is saved into JSON.

For example:

![Export format example](https://user-images.githubusercontent.com/15877754/31861749-d5c3ab24-b732-11e7-9438-d5cf28592f0d.png)

produces

```json
{
  "0": {  -- index 0 means root frame
    "title": "Root dialog title",  -- every frame has its title
    "text": "Root dialog text", -- every frame has its text
    "options": [  -- the list of child options for this frame
      {
        "title": "First option",  -- every option has its title
        "link": 3  -- index of frame that will be opened if user clicks on this option. Optional.
      },
      {
        "title": "Option without frame"   -- every option has its title
  		-- no link here. This means that the dialog will end after selecting this option
      }
    ]
  },
  "3": {  -- another frame. Every frame has its index.
    "title": "Second frame", -- every frame has its title
    "text": "", -- every frame has its text
    "options": []  -- this frame has no options.
  }
}
```
## TODOs

I know that there is still a lot to do, if you wanna help me, please check out the issues or submit your own ideas 😉