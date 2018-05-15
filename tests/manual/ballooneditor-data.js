/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals console:false, document, window */

import BalloonEditor from '../../src/ballooneditor';
import ArticlePluginSet from '@ckeditor/ckeditor5-core/tests/_utils/articlepluginset';

window.editors = [];
const container = document.querySelector( '.container' );

function initEditor() {
	BalloonEditor
		.create( '<h2>Editor 1</h2><p>This is an editor instance.</p>', {
			plugins: [ ArticlePluginSet ],
			toolbar: [ 'heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', 'undo', 'redo' ]
		} )
		.then( editor => {
			window.editors.push( editor );
			container.appendChild( editor.element );
		} )
		.catch( err => {
			console.error( err.stack );
		} );
}

function destroyEditor() {
	window.editors.forEach( editor => {
		editor.destroy()
			.then( () => {
				editor.element.remove();
			} );
	} );
}

document.getElementById( 'initEditor' ).addEventListener( 'click', initEditor );
document.getElementById( 'destroyEditor' ).addEventListener( 'click', destroyEditor );
