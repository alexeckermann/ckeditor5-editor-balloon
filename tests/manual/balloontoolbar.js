/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals console:false, document, window */

import BalloonToolbarEditor from '../../src/balloontoolbar';
import ArticlePreset from '@ckeditor/ckeditor5-presets/src/article';
import testUtils from '@ckeditor/ckeditor5-utils/tests/_utils/utils';

window.editors = {};
window.editables = [];
window._observers = [];

function initEditors() {
	init( '#editor-1' );
	init( '#editor-2' );

	function init( selector ) {
		BalloonToolbarEditor.create( document.querySelector( selector ), {
			plugins: [ ArticlePreset ],
			toolbar: [ 'headings', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote' ],
			image: {
				toolbar: [ 'imageStyleFull', 'imageStyleSide', '|', 'imageTextAlternative' ]
			}
		} )
		.then( editor => {
			console.log( `${ selector } has been initialized`, editor );
			console.log( 'It has been added to global `editors` and `editables`.' );

			window.editors[ selector ] = editor;
			window.editables.push( editor.editing.view.getRoot() );

			const observer = testUtils.createObserver();

			observer.observe(
				`${ selector }.ui.focusTracker`,
				editor.ui.focusTracker,
				[ 'isFocused' ]
			);

			window._observers.push( observer );
		} )
		.catch( err => {
			console.error( err.stack );
		} );
	}
}

function destroyEditors() {
	for ( const selector in window.editors ) {
		window.editors[ selector ].destroy().then( () => {
			console.log( `${ selector } was destroyed.` );
		} );
	}

	for ( const observer of window._observers ) {
		observer.stopListening();
	}

	window.editors = {};
	window.editables.length = window._observers.length = 0;
}

document.getElementById( 'initEditors' ).addEventListener( 'click', initEditors );
document.getElementById( 'destroyEditors' ).addEventListener( 'click', destroyEditors );
