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

		# Adds the user and key to the parameters, otherwise keeps all params.
		params.update( { :user => settings.api_user, :pass => settings.api_pass } )

		# Add params to URI
		uri = URI( settings.api_url )
		uri.query = URI.encode_www_form( params )

		# Get response and pass to user
		uri.open.read
	end
	
end