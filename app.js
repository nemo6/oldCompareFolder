const http       = require('http')
const fs         = require('fs')
const path       = require('path')
const port       = 8080
const _ 	 = require('lodash')
const Diff       = require('diff')
const multiparty = require('multiparty')

i  = 0
ii = 0

table1 = []
table2 = []

max = 150

function walk_folder_1(dir) {

	let list = fs.readdirSync(dir)

	list.forEach( file => {
		
		pathx = dir + '\\' + file
		
		let stats = fs.statSync(pathx)

		if ( stats.isFile() ) {

			fname = pathx.replace("\\\\PC-ONE\\","")
			fullname = JSON.stringify({ "name":fname, "size":stats.size})

			table1.push({"fullname":fullname, "d":"PC_ONE", "p":pathx })
			
			i++
		
		}else if (stats.isDirectory()){

			console.log(i,path.basename(pathx))

			if( i >= 150 )
			return 0

			walk_folder_1(pathx)
		}
		
	})

}

function walk_folder_2(dir) {

	let list = fs.readdirSync(dir)

	list.forEach( file => {
		
		pathx = dir + '\\' + file
		
		let stats = fs.statSync(pathx)

		if ( stats.isFile() ) {

			fname = pathx.replace("C:\\Users\\USERNAME\\","")
			fullname = JSON.stringify({ "name":fname, "size":stats.size})
			table2.push({ "fullname":fullname, "d":"PC_LOCAL", "p":pathx })
			
			ii++
		
		}else if (stats.isDirectory()){

			walk_folder_2(pathx)
		}
		
	})

}

walk_folder_1("\\\\PC-ONE\\Dropbox")

walk_folder_2("C:\\Users\\USERNAME\\Dropbox")

table = _.xorBy(table1,table2,"fullname")

PC_ONE = table.filter( x => x.d == "PC_ONE")
PC_LOCAL = table.filter( x => x.d == "PC_LOCAL")

PC_ONE = PC_ONE.map( x => { obj = JSON.parse(x.fullname); obj.p = x.p; return obj })
PC_LOCAL = PC_LOCAL.map( x => { obj = JSON.parse(x.fullname); obj.p = x.p; return obj })

customizer = (a, b) => Array.isArray(a) ? a.concat(b) : undefined

// d4 = _.mergeWith( {}, _.groupBy(PC_LOCAL,"name"), _.groupBy(PC_ONE,"name"), customizer)

// d5 = {}
// for( i in d4 ) if( d4[i].length >= 2 ) d5[i] = d4[i]

// d5 = _.pickBy( d4, (x) => x.length >= 2 )

http.createServer( async function (req, res) {

	if (req.url == '/'){
	
	res.writeHead(200,{'content-type':'text/html;charset=utf8'})

	res.end(`<pre id="PC_ONE">${JSON.stringify(PC_ONE,null,2)}</pre><pre id="PC_LOCAL">${JSON.stringify(PC_LOCAL,null,2)}</pre>`)

	/*res.end(`
	<style>

		table {

			font-family: sans-serif;
			border-collapse: collapse;
			width: 100%;
			table-layout: fixed;
			margin: 3px;
			
		}

		td,th {

			border: 1px solid #dddddd;
			text-align: center;
			padding: 8px;

		}

		.red {

			opacity : 0.5;
		}

	</style>
	
	<!-- <button onclick="send()">test</button> -->
	<!-- <a href="data?first=123&second=456"><button>test</button></a>  -->

	<form method="post" action="data" enctype="multipart/form-data" style="display:none">

	<input type="text" name="first" value="test1">
	<input type="text" name="second" value="test2">

	</form>

	<button onclick="send()">submit</button>

	<div id="diff"></div>

	<div style="display:flex">
	${render(PC_ONE,PC_LOCAL)}
	</div>

	<script>

	selection = []

	diff = { "first": null, "second": null }

	function send2(){

		var xhr = new XMLHttpRequest()
		xhr.open("POST", "data")
		xhr.onload = function (data) {

			if (xhr.readyState == 4 && xhr.status === 200) {

			document.getElementById('diff').innerHTML = xhr.response

			}
		
		}
		xhr.setRequestHeader("content-type","application/x-www-form-urlencoded;charset=utf8")
		xhr.send(JSON.stringify(diff))
	}

	function send(){

	document.querySelector("form").submit()

	}

	function color(e){

		if( selection.length >= 2 ){
			
			selection[0].classList.toggle("red")
			selection[1].classList.toggle("red")
			selection = []
		}

		if( e.title == "first" )
		diff.first = e.textContent

		if( e.title == "second" )
		diff.second = e.textContent
		
		e.classList.toggle("red")

		selection.push(e)

		document.querySelector("form").children[name="first"].value  = diff.first
		document.querySelector("form").children[name="second"].value = diff.second
		
	}

	</script>`)

	}

	else if (req.url == '/data' && req.url != '/favicon'){

		if( req.method == "POST" ){

			res.writeHead(200,{'content-type':'text/html;charset=utf8'})

			let form = new multiparty.Form()

			form.parse(req, async function(err, fields, files) {

				if( fields != undefined ){

					body = [{},...Object.keys(fields)].reduce( (o,x)=> Object.assign(o,{[x]:fields[x][0]}) )

					const diff = Diff.diffChars(
						fs.readFileSync(body.first,  'utf8'),
						fs.readFileSync(body.second, 'utf8')
					)

					var myJSONString = JSON.stringify(diff)
					.replace(/\\/g, "\\\\")
					.replace(/"/g, '\\"')

					res.end(`<pre id="display"></pre>
					<script src="https://cdnjs.cloudflare.com/ajax/libs/jsdiff/5.0.0/diff.min.js"></script>
					<script>

					const color = ''

					let span = null;

					display  = document.getElementById('display')
					fragment = document.createDocumentFragment()

					const raw = JSON.parse('${JSON.stringify(myJSONString)}')

					const diff = JSON.parse(raw)

					diff.forEach((part) => {
					const color = part.added ? 'green' :
					part.removed ? 'red' : 'grey';
					span = document.createElement('span');
					span.style.color = color;
					span.appendChild(document
					.createTextNode(part.value));
					fragment.appendChild(span);
					});

					display.appendChild(fragment);
					</script> `)
				
				}else{

					res.end("...")
				}

			})
		}*/

	}

	else{

		res.end("...")
	}

}).listen(port)

console.log(`Running at port ${port}`)

// res.end(`<pre>${ JSON.stringify( _.xorBy(PC_ONE,PC_LOCAL,"name"), null, 2 ) }</pre>`)

// res.end(`<pre id="PC_ONE">${JSON.stringify(PC_ONE,null,2)}</pre><pre id="PC_LOCAL">${JSON.stringify(PC_LOCAL,null,2)}</pre>`)

// res.end(`<pre>${ JSON.stringify(d5,null,2) }</pre>`)

function bodyParser (req) { 

	return new Promise( resolve => {

		body = ''
		req.on( 'data', data => body += data)
		req.on( 'end', () => resolve(body) )

	})

}

function render(a,b){

	let max,min

	content = "<table>"

	if( a.length > b.length){

		max = a
		min = b

	}else{

		max = b
		min = a
	}

	max = max.map( x => x.p )
	min = min.map( x => x.p )

	arr = Array(max.length).fill("&#8203;")

	min = min.concat(arr)

	for(i=0;i<max.length;i++){

		content += `<tr><td onclick="color(this)" title="first" >${max[i]}</td><td onclick="color(this)" title="second">${min[i]}</td></tr>`

	}

	content += "</table>"

	return content

}

function render2(data){

	keys = Object.keys(data)

	content = "<table>"

	for(i=0;i<max.length;i++){

		id = x.split("\\").pop()

		content += `<tr><td rowspan="2">${id}</td><td>${data[i][0]}</td></tr>
		<tr><td>${id}</td></tr>`

		content += `<tr><td onclick="color(this)" title="first" >${max[i]}</td><td onclick="color(this)" title="second">${min[i]}</td></tr>`

	}

	content += "</table>"

	return content

}
