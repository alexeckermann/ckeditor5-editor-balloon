/**
 * @license Copyright (c) 2003-2018, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md.
 */

/* globals document, Event */

import BalloonEditorUI from '../src/ballooneditorui';
import BalloonEditorUIView from '../src/ballooneditoruiview';

import HtmlDataProcessor from '@ckeditor/ckeditor5-engine/src/dataprocessor/htmldataprocessor';

import { downcastElementToElement } from '@ckeditor/ckeditor5-engine/src/conversion/downcast-converters';
import { upcastElementToElement } from '@ckeditor/ckeditor5-engine/src/conversion/upcast-converters';

import BalloonEditor from '../src/ballooneditor';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import BalloonToolbar from '@ckeditor/ckeditor5-ui/src/toolbar/balloon/balloontoolbar';
import DataApiMixin from '@ckeditor/ckeditor5-core/src/editor/utils/dataapimixin';
import ElementApiMixin from '@ckeditor/ckeditor5-core/src/editor/utils/elementapimixin';
import RootElement from '@ckeditor/ckeditor5-engine/src/model/rootelement';

import testUtils from '@ckeditor/ckeditor5-core/tests/_utils/utils';

describe( 'BalloonEditor', () => {
	let editor, editorElement;

	testUtils.createSinonSandbox();

	beforeEach( () => {
		editorElement = document.createElement( 'div' );
		editorElement.innerHTML = '<p><strong>foo</strong> bar</p>';

		document.body.appendChild( editorElement );
	} );

	afterEach( () => {
		editorElement.remove();
	} );

	describe( 'constructor()', () => {
		beforeEach( () => {
			editor = new BalloonEditor( editorElement, {
				plugins: [ BalloonToolbar, Bold ],
				toolbar: [ 'Bold' ]
			} );
		} );

		it( 'pushes BalloonToolbar to the list of plugins', () => {
			expect( editor.config.get( 'plugins' ) ).to.include( BalloonToolbar );
		} );

		it( 'pipes config#toolbar to config#balloonToolbar', () => {
			expect( editor.config.get( 'balloonToolbar' ) ).to.have.members( [ 'Bold' ] );
		} );

		it( 'uses HTMLDataProcessor', () => {
			expect( editor.data.processor ).to.be.instanceof( HtmlDataProcessor );
		} );

		it( 'has a Data Interface', () => {
			testUtils.isMixed( BalloonEditor, DataApiMixin );
		} );

		it( 'has a Element Interface', () => {
			testUtils.isMixed( BalloonEditor, ElementApiMixin );
		} );

		it( 'creates main root element', () => {
			expect( editor.model.document.getRoot( 'main' ) ).to.instanceof( RootElement );
		} );

		it( 'handles form element', () => {
			const form = document.createElement( 'form' );
			const textarea = document.createElement( 'textarea' );
			form.appendChild( textarea );
			document.body.appendChild( form );

			// Prevents page realods in Firefox ;|
			form.addEventListener( 'submit', evt => {
				evt.preventDefault();
			} );

			return BalloonEditor.create( textarea, {
				plugins: [ Paragraph ]
			} ).then( editor => {
				expect( textarea.value ).to.equal( '' );

				editor.setData( '<p>Foo</p>' );

				form.dispatchEvent( new Event( 'submit', {
					// We need to be able to do preventDefault() to prevent page reloads in Firefox.
					cancelable: true
				} ) );

				expect( textarea.value ).to.equal( '<p>Foo</p>' );

				return editor.destroy().then( () => {
					form.remove();
				} );
			} );
		} );

		it( 'allows to pass data to the constructor', () => {
			return BalloonEditor.create( '<p>Hello world!</p>', {
				plugins: [ Paragraph ]
			} ).then( editor => {
				expect( editor.getData() ).to.equal( '<p>Hello world!</p>' );
			} );
		} );

		it( 'should have undefined the #sourceElement if editor was initialized with data', () => {
			return BalloonEditor
				.create( '<p>Foo.</p>', {
					plugins: [ Paragraph, Bold ]
				} )
				.then( newEditor => {
					expect( newEditor.sourceElement ).to.be.undefined;

					return newEditor.destroy();
				} );
		} );

		it( 'editor.element should contain the whole editor (with UI) element', () => {
			return BalloonEditor.create( '<p>Hello world!</p>', {
				plugins: [ Paragraph ]
			} ).then( editor => {
				expect( editor.editing.view.getDomRoot() ).to.equal( editor.element );
			} );
		} );
	} );

	describe( 'create()', () => {
		beforeEach( function() {
			return BalloonEditor
				.create( editorElement, {
					plugins: [ Paragraph, Bold ]
				} )
				.then( newEditor => {
					editor = newEditor;
				} );
		} );

		afterEach( () => {
			return editor.destroy();
		} );

		it( 'creates an instance which inherits from the BalloonEditor', () => {
			expect( editor ).to.be.instanceof( BalloonEditor );
		} );

		it( 'creates element–less UI view', () => {
			expect( editor.ui.view.element ).to.be.null;
		} );

		it( 'attaches editable UI as view\'s DOM root', () => {
			const domRoot = editor.editing.view.getDomRoot();

			expect( domRoot ).to.equal( editor.element );
			expect( domRoot ).to.equal( editor.ui.view.editable.element );
		} );

		it( 'creates the UI using BalloonEditorUI classes', () => {
			expect( editor.ui ).to.be.instanceof( BalloonEditorUI );
			expect( editor.ui.view ).to.be.instanceof( BalloonEditorUIView );
		} );

		it( 'loads data from the editor element', () => {
			expect( editor.getData() ).to.equal( '<p><strong>foo</strong> bar</p>' );
		} );

		// ckeditor/ckeditor5-editor-classic#53
		it( 'creates an instance of a BalloonEditor child class', () => {
			// Fun fact: Remove the next 3 lines and you'll get a lovely inf loop due to two
			// editor being initialized on one element.
			const editorElement = document.createElement( 'div' );
			editorElement.innerHTML = '<p><strong>foo</strong> bar</p>';

			document.body.appendChild( editorElement );

			class CustomBalloonEditor extends BalloonEditor {}

			return CustomBalloonEditor
				.create( editorElement, {
					plugins: [ Paragraph, Bold ]
				} )
				.then( newEditor => {
					expect( newEditor ).to.be.instanceof( CustomBalloonEditor );
					expect( newEditor ).to.be.instanceof( BalloonEditor );

					expect( newEditor.getData() ).to.equal( '<p><strong>foo</strong> bar</p>' );

					editorElement.remove();

					return newEditor.destroy();
				} );
		} );
	} );

	describe( 'create - events', () => {
		afterEach( () => {
			return editor.destroy();
		} );

		it( 'fires all events in the right order', () => {
			const fired = [];

			function spy( evt ) {
				fired.push( evt.name );
			}

			class EventWatcher extends Plugin {
				init() {
					this.editor.on( 'pluginsReady', spy );
					this.editor.on( 'uiReady', spy );
					this.editor.on( 'dataReady', spy );
					this.editor.on( 'ready', spy );
				}
			}

			return BalloonEditor
				.create( editorElement, {
					plugins: [ EventWatcher ]
				} )
				.then( newEditor => {
					expect( fired ).to.deep.equal( [ 'pluginsReady', 'uiReady', 'dataReady', 'ready' ] );

					editor = newEditor;
				} );
		} );

		it( 'fires dataReady once data is loaded', () => {
			let data;

			class EventWatcher extends Plugin {
				init() {
					this.editor.on( 'dataReady', () => {
						data = this.editor.getData();
					} );
				}
			}

			return BalloonEditor
				.create( editorElement, {
					plugins: [ EventWatcher, Paragraph, Bold ]
				} )
				.then( newEditor => {
					expect( data ).to.equal( '<p><strong>foo</strong> bar</p>' );

					editor = newEditor;
				} );
		} );

		it( 'fires uiReady once UI is ready', () => {
			let isRendered;

			class EventWatcher extends Plugin {
				init() {
					this.editor.on( 'uiReady', () => {
						isRendered = this.editor.ui.view.isRendered;
					} );
				}
			}

			return BalloonEditor
				.create( editorElement, {
					plugins: [ EventWatcher ]
				} )
				.then( newEditor => {
					expect( isRendered ).to.be.true;

					editor = newEditor;
				} );
		} );
	} );

	describe( 'destroy()', () => {
		beforeEach( function() {
			return BalloonEditor
				.create( editorElement, { plugins: [ Paragraph ] } )
				.then( newEditor => {
					editor = newEditor;

					const schema = editor.model.schema;

					schema.register( 'heading' );
					schema.extend( 'heading', { allowIn: '$root' } );
					schema.extend( '$text', { allowIn: 'heading' } );

					editor.conversion.for( 'upcast' ).add( upcastElementToElement( { model: 'heading', view: 'heading' } ) );
					editor.conversion.for( 'dataDowncast' ).add( downcastElementToElement( { model: 'heading', view: 'heading' } ) );
					editor.conversion.for( 'editingDowncast' ).add( downcastElementToElement( {
						model: 'heading',
						view: 'heading-editing-representation'
					} ) );
				} );
		} );

		it( 'sets the data back to the editor element', () => {
			editor.setData( '<p>a</p><heading>b</heading>' );

			return editor.destroy()
				.then( () => {
					expect( editorElement.innerHTML )
						.to.equal( '<p>a</p><heading>b</heading>' );
				} );
		} );

		it( 'should not throw an error if editor was initialized with the data', () => {
			return BalloonEditor
				.create( '<p>Foo.</p>', {
					plugins: [ Paragraph, Bold ]
				} )
				.then( newEditor => newEditor.destroy() );
		} );
	} );
} );
