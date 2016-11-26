# Controls application document presentation in the side panel

Panel = require('./Panel.coffee')

class Modal extends Panel

    # E V E N T S

    #@EVENT_ARTICLES_LINK : "EVENT_ARTICLES_LINK"

    # M E M B E R S
   
    modal: null

    colors : null # Array<THREE.Color> generated color values for visualization

    baseApiUrl: '/guardian-galaxy-api' # Fallback on prod URL if dev env is not detected

    # C O N S T R U C T O R

    # Create info console panel.
    constructor: (id) ->

        super(id)

        if window.location.hostname == '127.0.0.1' or window.location.hostname == '0.0.0.0' or window.location.hostname == 'localhost'
            @baseApiUrl = 'http://' + '127.0.0.1' + ':5000' # dev url

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
        $("#related-articles-title").hide()


    setTitle: (title) ->
        $(@modal.title.id).text(title)


    setColors : (@colors) =>


    setDocumentHTML: (document) ->
       
        $(@modal.document.id).html(document)
        $(@modal.document.id).append("<div class='fold-fade'> </div>")
        #@setArticlesLink()
        $("#article-list-link").show()


    setDocumentListHTML: (document) ->
        $(".article").text("")
        $("#article-list").text("")
        $("#article-list").html(document)
        #$("#article-list-link").hide()
        $("#landing-intro-container").show()


    setDocumentGuardianLink: (url) ->
        #$(@modal.link.href).text(url) # Doesn't work idk
        $("#read-more-link").attr("href", url)
        $("#read-more-link").show()


    setSimilarDocuments: (documents, section) ->
        $(@modal.similar.id).text("")
        html = @getDocumentsListHtml(documents, section)
        $(@modal.similar.id).append(html)
        # show similar documents section
        $(@modal.similar.id).show()
        $(@modal.hr.id).show()
        $("#related-articles-title").show()


    toggleHidden: ->
        $('#wrapper').toggleClass('toggled').promise().done ->
            # setTimeout(function() {
            #   window.dispatchEvent new Event('resize')
            # }, 2000);
            setTimeout (-> # TODO: Remove this setTimeout and replace with working promise ~ .dh
                window.dispatchEvent new Event('resize')
                return
            ), 1000


    getDocumentsListHtml: (docs, section) ->
        docsHtml = (
            "<a class='document'
                style='color:#{@colors[doc.cid].getStyle()}'
                data-section='#{section}'
                data-doc-id='#{doc.id}'>#{doc.title}</a>
            <br/>" for doc in docs).join('')
        

    # display a list of documents
    displayDocumentsList: (documents, section) ->
        @clear()
        @setTitle "Sample of Documents in Selected Clusters"

        # hide similar documents section
        $(@modal.similar.id).hide()
        $(@modal.hr.id).hide()

        # shuffle documents array. we don't want to render all 1,000+
        Array::shuffle = -> @sort -> 0.5 - Math.random()
        docs = documents.shuffle()[0..45]

        # format html and add to dom
        docsHtml = @getDocumentsListHtml(docs, section)

        # show article list
        $("#article-list").show()
        
        @setDocumentListHTML(docsHtml)


    # display one particular document
    displayDocument: (docId, section) ->

        # hide document list
        @setTitle ""
        $("#article-list").hide()
        # hide intro
        $("#landing-intro-container").hide()
        # show similar documents section
        $(@modal.similar.id).show()
        $(@modal.hr.id).show()
        # scroll to top of the article
        $("#sidebar-wrapper").scrollTop(300)
        # clear out any currently viewed articles before loading the new one
        $(@modal.document.id).text("")
        $(@modal.document.id).show()

        # async retrieve document contents and similar docs, then set html
        @getDocumentContents docId, (data) =>
            @setTitle data.title
            @setDocumentHTML data.html
            @setDocumentGuardianLink data.url

        @getSimilarDocuments(docId, section, (data) =>
            @setSimilarDocuments(data.most_similar, section))


    onClickDocument: (event) =>
        event.preventDefault()
        docId = $(event.target).data 'doc-id' 
        section = $(event.target).data 'section' 
        @displayDocument docId, section


    getDocumentContents: (id, callback) =>

        $.ajax(
            url: "#{@baseApiUrl}/doc/#{id}"
            type: 'GET'
            contentType: 'application/json'
            beforeSend: ->
                $('#sidePanelBody i.article-spinner').addClass('fa fa-spinner fa-pulse fa-3x fa-fw')
            success: (data) ->
                $('#sidePanelBody i.article-spinner').removeClass('fa fa-spinner fa-pulse fa-3x fa-fw')
                callback(data)
        )


    getSimilarDocuments: (id, section, callback) =>

        $.ajax(
            url: "#{@baseApiUrl}/doc/#{id}/section/#{section}/most_similar"
            type: 'GET'
            contentType: 'application/json'
            beforeSend: ->
                $('#sidePanelBody i.related-articles-spinner').addClass('fa fa-spinner fa-pulse fa-3x fa-fw')
            success:  (data) ->
                $('#sidePanelBody i.related-articles-spinner').removeClass('fa fa-spinner fa-pulse fa-3x fa-fw')
                callback(data)
        )


module.exports = Modal

