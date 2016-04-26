# Info.coffee
# Tomasz (Tomek) Zemla
# tomek@datacratic.com

# Controls application info console on the right side of the application window.

Panel = require('./Panel.coffee')

class Info extends Panel


   # C O N S T R U C T O R

   # Create info console panel.
   constructor: (id) ->

      super(id)


   # M E T H O D S

   # Display given message keeping the existing text intact.
   display: (message) ->

      $('#message').append(message + "<br/>")

   # Display list of messages, clearing the console before hand
   displayList: (messages) ->
      this.clear()
      # shuffle messages array. we don't want to render all 1,000+
      Array::shuffle = -> @sort -> 0.5 - Math.random()
      messages = messages.shuffle()[0..50]
      # format msg to be max length
      len = 60
      messages = (msg.substring(0,len) for msg in messages)
      # conditionally add ellipsis
      msgsFormatted = []
      for msg in messages
          if msg.length == len
          then msgsFormatted.push(msg + '...')
          else msgsFormatted.push msg
      # format html and add to dom
      messagesHtml = (msg + "<br/>" for msg in msgsFormatted).join('')
      $('#message').append(messagesHtml)


   # Clear the info console.
   clear: ->
      
      $('#message').text("")


module.exports = Info
