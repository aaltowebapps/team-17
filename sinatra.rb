class ReittiSuperDial < Sinatra::Base

	get '/' do 
		# Renders the haml template index.haml
		# with the default layout layout.haml
		haml :index, :layout => :layout
	end
	
end