// TODO place this logic into a src/Modal.coffee class that talks to src/Storage.coffee

// asynchornously get the articles that are most similar according to doc2vec
function setMostSimilar(modal, documentId) {
  $.ajax({
    url: 'http://localhost:5000/doc/' + documentId + '/most_similar',
    type: 'GET',
    contentType: 'application/json',
    success: function(data) {
      similar = data.most_similar
      modal.find('.modal-body .similar').text("")
      html = ""
      for (var i = 0; i < similar.length; i++) {
        //html += similar[i].title + '<br/>'
        html += "<a class='similar' data-doc-id='" + similar[i].id + "'>" + similar[i].title + "</a><br/>"
      }
      modal.find('.modal-body .similar').append(html)
    }
  });
}

function setArticle(modal, documentId) {
  $.ajax({
    url: 'http://localhost:5000/doc/' + documentId,
    type: 'GET',
    contentType: 'application/json',
    success: function(data) {
      console.log(data);
      modal.find('.modal-title').text(data.title)
      modal.find('.modal-body .article').text("")
      modal.find('.modal-body .article').append(data.html)
    }
  });
}

/* TODO pull into src/Modal.coffee
$('#myModal').on('show.bs.modal', function(event) {
  var anchor = $(event.relatedTarget) // anchor that triggered the modal
  var documentId = anchor.data('doc-id') // Extract info from data-* attributes
  var modal = $(this)
  setArticle(modal, documentId);
  setMostSimilar(modal, documentId);

})

$('.similar').on('click', function(event) {
  var anchor = $(event.target) // anchor that triggered the modal
  var documentId = anchor.data('doc-id') // Extract info from data-* attributes
  var modal = $('#myModal');
  setArticle(modal, documentId);
  setMostSimilar(modal, documentId);
})
*/
