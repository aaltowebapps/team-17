require 'open-uri'

class ReittiSuperDial < Sinatra::Base

	set :api_url, "http://api.reittiopas.fi/hsl/prod/"
	set :api_user, "reittisuperdial"
	set :api_pass, "html5"

	get '/' do 
		# Renders the haml template index.haml
		# with the default layout layout.haml
		haml :index, :layout => :layout
	end

	get '/reittiopas' do

		# Set content type to json
		content_type 'application/json'

		# Adds the user and key to the parameters, otherwise keeps all params.
		params.update( { :user => settings.api_user, :pass => settings.api_pass } )

		# Add params to URI
		uri = URI( settings.api_url )
		uri.query = URI.encode_www_form( params )

		# Get response and pass to user
		begin
			uri.open.read
		rescue SystemCallError, SocketError
			# this is just for being able to test the UI offline
  			send_file File.join(settings.public_folder, 'sampleroute.json')
		end
	end

	get '/manifest.appcache' do
		headers 'Content-Type' => 'text/cache-manifest'
		Manifesto.cache :excludes => ['img/poster/', 'img/40px/', 'sampleroute.json'], :network_includes => ['/reittiopas', 'http://api.reittiopas.fi', '*']
	end
	
end