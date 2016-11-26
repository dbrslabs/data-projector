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


    # Display list of documents, clearing the console before hand
    displayDocuments: (data) ->

        this.clear()
        # shuffle documents array. we don't want to render all 1,000+
        Array::shuffle = -> @sort -> 0.5 - Math.random()
        documents = data.documents.shuffle()[0..45]
        # format doc to be max length, conditionally adding ellipsis
        len = 60
        for doc, i in documents
            title = doc.title.substring(0,len)
            if title.length == len then title = title + '...'
            documents[i].title = title
        # format html and add to dom
        docsHtml = ("<a data-toggle='modal' data-target='#myModal' data-doc-id='#{doc.id}'>#{doc.title}</a><br/>" for doc in documents).join('')
        $('#message').append(docsHtml)


    # Clear the info console.
    clear: ->
      
        $('#message').text("")


module.exports = Info
