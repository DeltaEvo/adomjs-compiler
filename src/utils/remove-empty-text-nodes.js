const { TEXT_NODE } = require('./constants')

module.exports = function removeEmptyTextNodes(elem) {
	if (elem.childNodes)
		for(const child of Array.from(elem.childNodes)) {
			if (child.nodeType === TEXT_NODE && child.data.trim() === '')
				elem.removeChild(child)
			removeEmptyTextNodes(child)
		}
}