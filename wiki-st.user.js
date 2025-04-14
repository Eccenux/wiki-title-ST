// ==UserScript==
// @name         Wiki-ST
// @namespace    pl.enux.wiki
// @version      2025-04-15
// @description  Sprzątanie Tytułu. Usuwa m.in. dopisek po kresce z tytułów oraz skraca przestrzenie nazw.
// @author       Nux
// @match        https://pl.wikipedia.org/*
// @match        https://en.wikipedia.org/*
// @match        https://pl.wikimedia.org/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=wikipedia.org
// @grant        none
// @run-at       document-idle
// @noframes
// @updateURL    https://github.com/Eccenux/wiki-title-ST/raw/main/wiki-st.meta.js
// @downloadURL  https://github.com/Eccenux/wiki-title-ST/raw/main/wiki-st.user.js
// ==/UserScript==

// Note! Using `document-idle` so that `mw.config.get` works.

/* global mw */
(function() {
	'use strict';
	
	const user = getUser();

	const origTitle = document.title;
	let title = origTitle;
	// remove site title
	title = title.replace(/(.+) (–|-) .+/, '$1');
	// action indicator init
	let actionInd = '';
	if (location.search.includes('action=edit')) {
		title = title.replace(/^Ed[^]\S+ /, '');
		actionInd = '✏️';
	}
	// special page with target
	let nsNumber = mwConfGet('wgNamespaceNumber', false);
	if (nsNumber === -1) {
		let userTarget = mwConfGet('wgRelevantUserName', false);
		if (userTarget !== false) {
			title = 's:' + mwConfGet('wgCanonicalSpecialPageName', 'nn') + '/' + userTarget;
		}
	}
	// namespace
	if (nsNumber !== -1 && title.includes(':')) {
		title = title.replace(/([^ ].+?):/, (a, ns)=>{
			let nsShort = shortNamespace(ns);
			return (!nsShort) ? a : nsShort + ':';
		});
	}
	// site lang if foreign
	let siteIndicator = location.host.replace(/^(\w+)\..+/, '$1');
	if (siteIndicator == 'pl') {
		siteIndicator = '';
	}
	if (siteIndicator.length) {
		title = siteIndicator + ': ' + title;
	}
	// action
	if (siteIndicator.length) {
		title = actionInd + ' ' + title;
	}
	// current user
	// test on: https://pl.wikipedia.org/wiki/Wikipedysta:Nux/vedit
	if (user && title.includes(user)) {
		const escapedUser = escapeRegexp(user);
		title = title.replace(new RegExp(`[a-z]:${escapedUser}/`), '~/');		
	}
	// finalize
	if (title && title !== origTitle) {
		document.title = title;
	}
	
	/** @return Safe `mw.config.get`. */
	function mwConfGet(key, defVal = false) {
		if (!window.mw) {
			return defVal;
		}
		if (typeof mw?.config?.get === 'function') {
			const value = mw.config.get(key);
			if (value !== null) {
				return value;
			}
		}
		return defVal;
	}

	/** @return wgUserName or false if anon/nn. */
	function getUser() {
		const user = mwConfGet('wgUserName', false);
		return user && user.length ? user : false;
	}
	
	/** @return String safe-ish for RegExp. */
	function escapeRegexp(string) {
		return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
	}

	/** @return Short namesapce or false. */
	function shortNamespace(ns) {
		const nsShorts = new Map([
			['u', ['Wikipedystka', 'Wikipedysta', 'User']],
			['u.t', ['Dyskusja wikipedystki', 'Dyskusja wikipedysty', 'User talk']],
			['man', ['Pomoc', 'Help']],
			['man.t', ['Dyskusja pomocy', 'Help talk']],
			['tpl', ['Szablon', 'Template']],
			['tpl.t', ['Dyskusja szablonu', 'Template talk']],
			['mod', ['Moduł', 'Module']],
			['mod.t', ['Dyskusja modułu', 'Module talk']],
			['wp', ['Wikipedia']],
			['wp.t', ['Dyskusja Wikipedii', 'Wikipedia talk']],
			
			//['spc', ['Specjalna', 'Special']],
		]);
		for (const [nsShort, arr] of nsShorts) {
			if (arr.includes(ns)) {
				return nsShort;
			}
		}
		return false;
	}		
})();
