const documentNameHeader = document.getElementById('documentNameHeaderId')
const pdfContainer = document.getElementById('pdfContainer')

var documentId

document.addEventListener('DOMContentLoaded', () => {

  location.pathname.split('/').forEach((urlPart) => {
    if (urlPart.trim().length > 0 && /^[0-9]*$/.test(urlPart)) {
      documentId = parseInt(urlPart)
    }
  })

  axios.get(`/api/document/${documentId}`).then((response) => {
    const { name } = response.data.data
    documentNameHeader.innerHTML = name
  })

  const documentEmbed = document.createElement('embed')
  documentEmbed.src = `/api/document/${documentId}/view`
  documentEmbed.type = 'application/pdf'
  documentEmbed.width = '100%'
  documentEmbed.height = '100%'
  pdfContainer.appendChild(documentEmbed)

})