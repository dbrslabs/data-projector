
# Controls application info console on the right side of the application window.

Panel = require('./Panel.coffee')

class Modal extends Panel


   # M E M B E R S
   
   modal: null


   # C O N S T R U C T O R

   # Create info console panel.
   constructor: (id) ->

      super(id)

      @modal = {
         title : { id : "#myModalLabel" },
         similar : { id : "#myModalBody .similar" },
         document: { id : "#myModalBody .article" },
      }


   # M E T H O D S

   # Clear the info console.
   clear: ->
      
      this.setTitle("")
      this.setDocumentHTML("")
      this.setSimilarDocuments([])


   setTitle: (title) ->

       $(@modal.title.id).text(title)



   setDocumentHTML: (document) ->

       $(@modal.document.id).text(document)
       $(@modal.document.id).html(document)



   setSimilarDocuments: (documents) ->

      html = ""
      for d in documents
         html += "<a class='similar' data-doc-id='" + d.id + "'>" + d.title + "</a><br/>"
      $(@modal.similar.id).text(html)
      $(@modal.similar.id).append(html)



   # Display list of documents, clearing the modal before hand
   displayDocumentsList: (documents) ->

      this.clear()
      # shuffle documents array. we don't want to render all 1,000+
      Array::shuffle = -> @sort -> 0.5 - Math.random()
      docs = documents.shuffle()[0..45]
      # format doc to be max length, conditionally adding ellipsis
      len = 60
      for doc, i in docs
          title = doc.title.substring(0,len)
          if title.length == len then title = title + '...'
          docs[i].title = title
      # format html and add to dom
      docsHtml = ("<a data-toggle='modal' data-target='#myModal' data-doc-id='#{doc.id}'>#{doc.title}</a><br/>" for doc in docs).join('')
      this.setDocumentHTML(docsHtml)



   displayDocumentContents: (document) ->
       console.log('TODO display document', document)


module.exports = Modal
