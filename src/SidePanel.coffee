# Controls application document presentation in the side panel

Panel = require('./Panel.coffee')
Utility = require('./Utility.coffee')

class Modal extends Panel


   # M E M B E R S
   
   modal: null


   # C O N S T R U C T O R

   # Create info console panel.
   constructor: (id) ->

      super(id)

      @modal = 
         title:    { id : "#sidePanelTitle" }
         similar:  { id : "#sidePanelBody .similar" }
         document: { id : "#sidePanelBody .article" }
         hr :      { id : "#sidePanelBody hr" }

      # handle clicking document links
      $(id).on 'click', '.document', @onClickDocument



   # M E T H O D S

   # Clear the info console.
   clear: ->
      
      @setTitle("")
      @setDocumentHTML("")
      @setSimilarDocuments([])


   setTitle: (title) ->

       $(@modal.title.id).text(title)



   setDocumentHTML: (document) ->

       $(@modal.document.id).text("")
       $(@modal.document.id).html(document)



   setSimilarDocuments: (documents) ->

      html = ""
      for d in documents
         html += "<a class='document' data-doc-id='" + d.id + "'>" + d.title + "</a><br />"
      $(@modal.similar.id).text("")
      $(@modal.similar.id).append(html)



   toggleHidden: ->

      $("#wrapper").toggleClass "toggled"



   # display a list of documents
   displayDocumentsList: (documents) ->

      @clear()
      @setTitle "Random Document Sample in Selected Clusters"

      # if mobile, toggle sidepanel visibility
      if Utility.isMobile() then @toggleHidden() 

      # hide similar documents section
      $(@modal.similar.id).hide()
      $(@modal.hr.id).hide()

      # shuffle documents array. we don't want to render all 1,000+
      Array::shuffle = -> @sort -> 0.5 - Math.random()
      docs = documents.shuffle()[0..45]
      # format doc to be max length, conditionally adding ellipsis
      len = 57
      for doc, i in docs
          title = doc.title.substring(0,len)
          if title.length == len then title = title + '...'
          docs[i].title = title
      # format html and add to dom
      docsHtml = ("<a class='document' data-doc-id='#{doc.id}'>#{doc.title}</a><br/>" for doc in docs).join('')
      @setDocumentHTML(docsHtml)



   # display one particular document
   displayDocument: (docId) ->
         
      # show similar documents section
      $(@modal.similar.id).show()
      $(@modal.hr.id).show()

      # async retrieve document contents and similar docs, then set html
      @getDocumentContents docId, (data) =>
         @setTitle data.title
         @setDocumentHTML data.html

      @getSimilarDocuments docId, (data) =>

         @setSimilarDocuments data.most_similar



   onClickDocument: (event) =>
      event.preventDefault()
      docId = $(event.target).data 'doc-id' 
      @displayDocument docId



   getDocumentContents: (id, callback) ->

      $.ajax(
         url: 'http://localhost:5000/doc/' + id
         type: 'GET'
         contentType: 'application/json'
         success: callback
      )



   getSimilarDocuments: (id, callback) ->

     $.ajax(
       url: 'http://localhost:5000/doc/' + id + '/most_similar'
       type: 'GET'
       contentType: 'application/json'
       success: callback
     )



module.exports = Modal

