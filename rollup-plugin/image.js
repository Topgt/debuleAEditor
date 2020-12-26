
import fs from 'fs'
import path from 'path'
import rollupPluginutils from 'rollup-pluginutils'

const mimeTypes = {
	'.jpg':  'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png':  'image/png',
	'.gif':  'image/gif',
	'.svg':  'image/svg+xml'
};

export default ( options ) => {
	if ( options === void 0 ) options = {};

	var filter = rollupPluginutils.createFilter( options.include, options.exclude );

	return {
		name: 'image',
		load: function load ( id ) {
			if ( !filter( id ) ) return null;

			const mime = mimeTypes[ path.extname( id ) ];
			if ( !mime ) return null; // not an image
			const data = fs.readFileSync( id, 'base64' );
			return `var src = 'data:${mime};base64,${data}'; export default src;`;
		}
	};
}
