# Controls application document presentation in the side panel

Panel = require('./Panel.coffee')
Utility = require('./Utility.coffee')
#Projector = require('./Projector.coffee')

class Modal extends Panel

   # E V E N T S

   #@EVENT_ARTICLES_LINK : "EVENT_ARTICLES_LINK"

   # M E M B E R S
   
   modal: null

   colors : null # Array<THREE.Color> generated color values for visualization

   # C O N S T R U C T O R

   # Create info console panel.
   constructor: (id) ->

      super(id)

      @modal = 
         title:    { id : "#sidePanelTitle" }
         similar:  { id : "#sidePanelBody .similar" }
         document: { id : "#sidePanelBody .article" }
         hr :      { id : "#sidePanelBody hr" }
         link :    { id : "#sidePanelBody .read-more-link-container #read-more-link" }

      # handle clicking document links
      $(id).on 'click', '.document', @onClickDocument
      
      # Remove the viz's custom events and use defaults in sidepanel
      # NOTE: None of these unbindings actually works. This is here so you know it won't work before you try ~ .dh
      $('#sidebar-wrapper').unbind 'scroll'
      $('#sidebar-wrapper').unbind 'onscroll'
      $('#sidebar-wrapper').unbind 'onmouseup'
      $('#sidebar-wrapper').unbind 'onmousedown'


   # M E T H O D S

   # Clear the info console.
   clear: ->
      @setTitle("")
      @setDocumentHTML("")
      @setSimilarDocuments([])
      $("#read-more-link").hide()
      $("#article-list-link").hide()
      $(".article").hide()

   setTitle: (title) ->
       $(@modal.title.id).text(title)


   setColors : (@colors) =>


   setDocumentHTML: (document) ->
       $(@modal.document.id).show()
       $(@modal.document.id).text("")
       $(@modal.document.id).html(document)
       $(@modal.document.id).append("<div class='fold-fade'> </div>")
       #@setArticlesLink()
       $("#article-list-link").show()


   setDocumentListHTML: (document) ->
       $(".article").text("")
       $("#article-list").text("")
       $("#article-list").html(document)


   setDocumentGuardianLink: (url) ->
       #$(@modal.link.href).text(url) # Doesn't work idk
       $("#read-more-link").attr("href", url)
       $("#read-more-link").show()


   # setArticlesLink: ->
   #    $("#article-list-link").click (event) ->
   #      event.preventDefault()
   #      @notify(Modal.EVENT_ARTICLES_LINK)


   setSimilarDocuments: (documents) ->
      html = ""
      for d in documents
         html += "<a class='document' data-doc-id='" + d.id + "'>" + d.title + "</a><br />"
      $(@modal.similar.id).text("")
      $(@modal.similar.id).append(html)
      # show similar documents section
      $(@modal.similar.id).show()
      $(@modal.hr.id).show()

   toggleHidden: ->
      $('#wrapper').toggleClass('toggled').promise().done ->
        # setTimeout(function() {
        #   window.dispatchEvent new Event('resize')
        # }, 2000);
        setTimeout (-> # TODO: Remove this setTimeout and replace with working promise ~ .dh
            window.dispatchEvent new Event('resize')
            return
        ), 1000
        
        #$(window).resize()
        #return
        

   # display a list of documents
   displayDocumentsList: (documents) ->
      @clear()
      @setTitle "Random Document Sample in Selected Clusters"

      # hide similar documents section
      $(@modal.similar.id).hide()
      $(@modal.hr.id).hide()

      # shuffle documents array. we don't want to render all 1,000+
      Array::shuffle = -> @sort -> 0.5 - Math.random()
      docs = documents.shuffle()[0..45]
      # format doc to be max length, conditionally adding ellipsis
      len = 47
      for doc, i in docs
          title = doc.title.substring(0,len)
          if title.length == len then title = title + '...'
          docs[i].title = title
          #console.log Object.getOwnPropertyNames(docs[i])
      # format html and add to dom
      #docsHtml = ("<span class='cluster-id' style='color:#{@colors['c1'].getStyle()}'></span><a class='document' data-doc-id='#{doc.id}'>#{doc.title}</a><br/>" for doc in docs).join('')
      docsHtml = ("<span class='cluster-id' style='background-color:#{@colors[doc.cid].getStyle()}'></span><a class='document' data-doc-id='#{doc.id}'>#{doc.title}</a><br/>" for doc in docs).join('')

      #console.log Object.getOwnPropertyNames(docs[0])

      # show article list
      $("#article-list").show()
      
      @setDocumentListHTML(docsHtml)


   # display one particular document
   displayDocument: (docId) ->

      # hide document list
      $("#article-list").hide()
         
      # show similar documents section
      $(@modal.similar.id).show()
      $(@modal.hr.id).show()

      # async retrieve document contents and similar docs, then set html
      @getDocumentContents docId, (data) =>
         @setTitle data.title
         @setDocumentHTML data.html
         @setDocumentGuardianLink data.url

      @getSimilarDocuments docId, (data) =>

         @setSimilarDocuments data.most_similar



   onClickDocument: (event) =>
      event.preventDefault()
      docId = $(event.target).data 'doc-id' 
      @displayDocument docId



   getDocumentContents: (id, callback) ->

      $.ajax(
        #url: 'http://127.0.0.1:5000/doc/' + id #dev
        url: '/guardian-galaxy-api/doc/' + id #prod
        type: 'GET'
        contentType: 'application/json'
        beforeSend: ->
             $('#sidePanelBody i.article-spinner').addClass('fa fa-spinner fa-pulse fa-3x fa-fw')
        success: (data) ->
             $('#sidePanelBody i.article-spinner').removeClass('fa fa-spinner fa-pulse fa-3x fa-fw')
             callback(data)
      )



   getSimilarDocuments: (id, callback) ->

     $.ajax(
       #url: 'http://127.0.0.1:5000/doc/' + id + '/most_similar' #dev
       url: '/guardian-galaxy-api/doc/' + id + '/most_similar' #prod
       type: 'GET'
       contentType: 'application/json'
       beforeSend: ->
            $('#sidePanelBody i.related-articles-spinner').addClass('fa fa-spinner fa-pulse fa-3x fa-fw')
       success:  (data) ->
            $('#sidePanelBody i.related-articles-spinner').removeClass('fa fa-spinner fa-pulse fa-3x fa-fw')
            callback(data)
     )



module.exports = Modal

