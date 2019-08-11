/*jshint strict:false, window:true */
if (!window.similarity) {
	similarity = (function() {
		var origBG,
			tagName = 'a',
			similar;

		function build(tag) {
			tag = tag || tagName;
			var all_els = document.getElementsByTagName(tag);
			for (var i = 0; i < all_els.length; i++) {
				var el = all_els[i];
				el.addEventListener('mouseover', highlightEl, true);
				el.addEventListener('mouseout', unHighlightEl, true);
				el.addEventListener('click', clickEl, true);
				document.addEventListener('keyup', docKeyUp, true);
			}
		}

		function docKeyUp(e) {
			if (e.target.tagName !== 'TEXTAREA')
				destroy(tagName);
		}

		function destroy(tag) {
			tag = tag || tagName;
			var all_els = document.getElementsByTagName(tag);

			var displayDiv = document.querySelector('#displayDiv');
			if (displayDiv) {
				document.body.removeChild(displayDiv);
			}
			for (var i = 0; i < all_els.length; i++) {
				var el = all_els[i];
				el.removeEventListener('mouseover', highlightEl, true);
				el.removeEventListener('mouseout', unHighlightEl, true);
				el.removeEventListener('click', clickEl, true);
				document.removeEventListener('keyup', docKeyUp, true);
			}
		}

		// private

		function highlightEl (e) {
			e.preventDefault();
			el = e.target;
			origBG = el.style.background;
			el.style.background = 'rgba(255, 132, 132, .5)';
		}

		function unHighlightEl (e) {
			e.preventDefault();
			el = e.target;
			el.style.background = origBG;
		}

		function closestLink (el) {

			var currEl = el;

			while (currEl.tagName !== 'BODY') {
				if (currEl.tagName === 'A') {
					break;
				} else {
					currEl = currEl.parentElement;
				}
			}

			return currEl;
		}

		function clickEl (e) {
			e.preventDefault();
			e.stopImmediatePropagation();

			var el = closestLink(e.target),
				parent,
				container,
				containerSelector = '',
				selector = '';

			if (el.tagName === 'A') {
				if (!isContainer(el.parentElement)) {
					selector += constructSelector(el.parentElement, false);
					selector += ' > ';
				}

				selector += constructSelector(el, false);
				container = findContainer(el);

				if (container && container !== el) {
					containerSelector = cssPath(container);
					selector = containerSelector + ' ' + selector;
				}

				selector += '[href]';

				if (selector) {
					similarity.similar = buildSimilarArray(document.querySelectorAll(selector));
					if (similarity.similar && similarity.similar.length > 0) {
						displayChoice();
					}
				}

			}
		}

		function buildSimilarArray (nodeList) {
			var similarArr = Array.prototype.slice.call(nodeList),
				output = [],
				uniqueURLs = [];

			for (var i = 0; i < similarArr.length; i++) {
				if (!/^#/.test(similarArr[i].href)) {
					if (uniqueURLs.indexOf(similarArr[i].href) === -1) {
						uniqueURLs.push(similarArr[i].href);
						if (similarArr[i].text.length === 0) {
							similarArr[i].text = similarArr[i].hostname;
						}
						if (similarArr[i].text.length > 0) {
							output.push(similarArr[i]);
						}
					}
				}
			};

			return output;
		}

		function isContainer (el) {
			var containers = ['UL','OL','DL','SECTION','ARTICLE'];
			return (containers.indexOf(el.tagName) > -1);
		}

		function constructSelector (el, useID) {
			var selector = '';
			useID = useID || false;
			selector += el.tagName.toLowerCase();
			if (useID && el.id !== '') {
				selector += '#' + el.id;
			}
			if (el.className !== '') {
				selector += '.' + el.className.replace(/ *(active|current)/,' ').replace(/ +/g,' ').trim().split(' ').join('.');
			}
			return selector;
		}

		function cssPath(el) {
		   if (!(el instanceof Element))
			   return;
		   var path = [];
		   while (el.nodeType === Node.ELEMENT_NODE) {
			   var selector = el.nodeName.toLowerCase();
			   if (el.id) {
				   selector += '#' + el.id;
				   path.unshift(selector);
				   break;
			   } else {
				   var sib = el, nth = 1;
				   while (sib = sib.previousElementSibling) {
					   if (sib.nodeName.toLowerCase() == selector)
						  nth++;
				   }
				   if (nth != 1)
					   selector += ":nth-of-type("+nth+")";
			   }
			   path.unshift(selector);
			   el = el.parentNode;
		   }
		   return path.join(" > ");
		}

		function findContainer(el) {
			var container = null,
				currEl = el;

			while (currEl.tagName !== 'BODY') {
				if (isContainer(currEl.parentElement)) {
					container = currEl.parentElement;
					break;
				} else {
					currEl = currEl.parentElement;
				}
			}

			if (container) {
				return container;
			} else {
				return el;
			}
		}

		function displayChoice () {
			var html = '<p>What would you like to do?</p><br><button id="similarity-Tabs">Open in tabs</button><button id="similarity-Markdown">Markdown list</button><button id="similarity-Links">Link list</button>';
			var bg = createBackground();
			var choiceDiv = document.createElement('div');
			choiceDiv.id = 'choiceDiv';
			choiceDiv.innerHTML = html;
			bg.appendChild(choiceDiv);

			var buttons = choiceDiv.querySelectorAll('button');
			for (var i = 0; i < buttons.length; i++) {
				var el = buttons[i];
				el.addEventListener('click', makeChoice, false);
			}
		}

		function makeChoice(e) {
			var choice = e.target.id.replace(/^similarity-/,'').toLowerCase();

			var choiceDiv = document.querySelector('#choiceDiv');
			choiceDiv.parentElement.removeChild(choiceDiv);

			if (choice === 'tabs') {
				openTabs();
			} else if (choice === 'markdown') {
				displayText(buildMarkdown());
			} else if (choice === 'links') {
			  displayText(buildLinks());
			}
		}

		function openTabs () {
			for (var i = 0; i < similarity.similar.length; i++) {
				var linkText = similarity.similar[i].text.replace(/\n+/g, ' ').trim();
				if (linkText.length > 0)
					window.open(similarity.similar[i].href, 'newTab' + i);
			};
		}

		function buildMarkdown () {
			var output = [],
				i,
				counter = 0;
			for (i = 0; i < similarity.similar.length; i++) {
				var linkText = similarity.similar[i].text.replace(/\n+/g, ' ').trim();
				var linkURL = similarity.similar[i].href;

				if (linkText.length > 0) {
					counter++;
					output.push(counter + '. [' + linkText + '](' + linkURL + ')');
				}
			}
			return output.join("\n");
		}
    
    function buildLinks() {
  		var output = [],
        i;
  		for (i = 0; i < similarity.similar.length; i++) {
  			var linkURL = similarity.similar[i].href;
        output.push(linkURL);
  		}
  		return output.join("\n");
    }

		function displayText (text) {
			var bg = createBackground();
			var textArea = document.createElement('textarea');
			textArea.innerHTML = text;
			bg.appendChild(textArea);
		}

		function createBackground () {
			if (document.querySelector('#displayDiv') !== null) {
				return document.querySelector('#displayDiv');
			}
			var displaySheet = document.createElement('style');
			var displayDiv = document.createElement('div');
			displayDiv.id = 'displayDiv';
			displayDiv.onclick = function(e) {
				if (e.target.tagName === 'DIV')
					destroy();
			};
			var displayStyle = '#displayDiv {z-index:10000;position:fixed;top:0;left:0;bottom:0;right:0;background:rgba(255,255,255,.5);}';
			displayStyle += '#displayDiv textarea {width:800px;height:50%;font-size:16px;top:10%;position:absolute;white-space:pre-wrap;padding:20px;left:50%;margin-left:-400px;}';
			displayStyle += '#choiceDiv{width:400px;margin:20% auto;background-color:rgba(255,255,255,0.7);color:#333;text-align:center;padding:20px;border-radius:10px;border:1px solid black !important}#choiceDiv p{font-family:Helvetica,arial,sans-serif!important;font-size:28px;font-weight:300;color:#777}#choiceDiv button{border:solid 1px cornflowerblue;background-color:transparent;padding:10px 2px;font-size:17px;border-radius:4px;color:cornflowerblue;font-family:Helvetica,arial,sans-serif!important;font-weight:300!important;margin-right:5px;width:170px}';
			displaySheet.innerHTML = displayStyle;
			document.head.appendChild(displaySheet);
			document.body.appendChild(displayDiv);
			return displayDiv;
		}

		return {
			similar: similar,
			// methods
			build: build,
			destroy: destroy,
		};
	}());
}

similarity.build('a');