var net = require('net');
var http = require('http');
var HOST = '127.0.0.1';
var PORT = 6969;

function httpagestr()
{
	var head = "<html><head><title>WebSocket Test Client</title></head>";
	var body = "<body>"+
        "<h1>WebSocket NodeJS Test Client</h1>"+
		"Server Address: <br>"+
		"<input type=\"text\" id=\"s\"></input> Port: <input type=\"text\" id=\"p\"></input><br>"+
		"<button onclick='sopen();'>Connect</button><br><br>"+
		"Message: <br><textarea cols=\"50\" rows=\"5\" id=\"t\"></textarea><br>"+
        "<button onclick='ssend();'>Send</button><br><br>"+
		"Response:"+
		"<p id=\"r\"></p>";
    
	var script = "<script>"+
			"var s = document.getElementById(\"s\");"+
			"var p = document.getElementById(\"p\");"+
			"var r = document.getElementById(\"r\");"+
			"var m=document.getElementById(\"t\");"+
			"function sopen()"+
			"{"+
				"var wri = \"ws://\"+s.value+\":\"+p.value+\"/chat\";"+
				
				"if (\"WebSocket\" in window) {"+
					"wS = new WebSocket(wri);"+
				"}"+
				"else {"+
					// Firefox 7/8 currently prefixes the WebSocket object
					"wS = new MozWebSocket(wri);"+
				"}"+
				
				"wS.onmessage = function(e) {"+
					"r.innerHTML = \"Got echo: \" + e.data;"+
				"}\n"+
				
				"wS.onopen = function(e) {"+
					"r.innerHTML = \"Got echo: \" + e.data;"+
				"}"+
			"}"+
			"function ssend()"+
			"{"+
				"wS.send(m.value);"+
			"}"+
			"window.onload = function(){"+
				"s.value=\""+HOST+"\";"+
				"p.value=\""+PORT.toString()+"\";"+
				"r.innerHTML =\"Closed\";"+
				
				"var wri = \"ws://\"+s.value+\":\"+p.value+\"/chat\";"+
				
				"if (\"WebSocket\" in window) {"+
					"wS = new WebSocket(wri);"+
				"}"+
				"else {"+
					// Firefox 7/8 currently prefixes the WebSocket object
					"wS = new MozWebSocket(wri);"+
				"}"+
				
				"wS.onmessage = function(e) {"+
					"r.innerHTML = \"Got echo: \" + e.data;"+
				"}\n"+
				
				"wS.onopen = function(e) {"+
					"r.innerHTML = \"Connected. Get echo: \" + e.data;"+
				"}"+
            "}"+
		"</script>";
	var tail = "</body></html>";
	return head+body+script+tail;
}
function toHexStr(_num)
{
    var _ret = "";
    switch(_num)
    {
        case 10:
            _ret = "a";
            break;
        case 11:
            _ret = "b";
            break;
        case 12:
            _ret = "c";
            break;
        case 13:
            _ret = "d";
            break;
        case 14:
            _ret = "e";
            break;
        case 15:
            _ret = "f";
            break;
        default:
            _ret = _num.toString();
            break;
    }
    return _ret;
}

function numToHexString(_num)
{
    var _ret="";
    if(_num >> 4) _ret = toHexStr(_num >> 4);
    else _ret = "0";
    
    _ret = _ret + toHexStr(_num & 0x0f);
    return _ret;
}

function sendStrWS(_sock, _str)
{
    var strlen =_str.length;
    
//    var mask = [Math.floor((Math.random() * 254) + 1),Math.floor((Math.random() * 254) + 1),Math.floor((Math.random() * 254) + 1),Math.floor((Math.random() * 254) + 1)];
    
    var strmix = "81" + numToHexString(strlen);
    //            var tmp;
    //            var maxval;
    //            for(i=0;i<4;i++)
    //            {
    //                strmix = strmix + numToHexString(mask[i]);
    //            }
    
    for (i = 0; i < strlen; i++) {
        //                console.log(strsend.substr(i,1).charCodeAt(0));
        //                maxval = mask[i % 4];
        //                tmp = numToHexString(parseInt(strsend.substr(i,1).charCodeAt(0))^maxval);
        //                tmp =numToHexString(strsend.substr(i,1).charCodeAt(0));
        //                strmix = strmix + tmp;
        strmix = strmix + numToHexString(_str.substr(i,1).charCodeAt(0));
    }
    //            console.log(strmix);
    _sock.write(new Buffer(strmix, "hex"));
}

function reverse(s){
    return s.split("").reverse().join("");
}

function getDataWS(_valin)
{
    var _ret = "";
    var _str = _valin.toString('hex');
    var len = (parseInt(_str.substr(2,2),16) & 0x7F);
    
    var mask = [parseInt(_str.substr(4,2),16),parseInt(_str.substr(6,2),16),parseInt(_str.substr(8,2),16),parseInt(_str.substr(10,2),16)];
    
    var j = 12;
    for(i = 0;i<len;i++)
    {
        _ret = _ret + String.fromCharCode(parseInt(_str.substr(j,2),16)^mask[i % 4]);
        j = j + 2;
    }

    return _ret;
}

// Create a server instance, and chain the listen function to it
// The function passed to net.createServer() becomes the event handler for the 'connection' event
// The sock object the callback function receives UNIQUE for each connection
net.createServer(function(sock) {
    
    // We have a connection - a socket object is assigned to the connection automatically
    console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);
    
    // Add a 'data' event handler to this instance of socket
    sock.on('data', function(data) {
        console.log('DATA ' + sock.remoteAddress + ': ' + data);
		
        // Write the data back to the socket, the client will receive it as data from the server
        var sec_regex = /Sec-WebSocket-Key: (.*)/g;
        var secWsKeyAr = sec_regex.exec(data);

        if(secWsKeyAr !== null)
        {
            var magicString = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
            var hash = require('crypto')
                 .createHash('SHA1')
                 .update(secWsKeyAr[1] + magicString)
                 .digest('base64');
            //var b64hash = new Buffer(hash).toString('base64');
            var handshake = "HTTP/1.1 101 Web Socket Protocol Handshake\r\n" +
                "Upgrade: WebSocket\r\n" +
                "Connection: Upgrade\r\n" +
                "Sec-WebSocket-Accept: " + hash + "\r\n" +
                "\r\n";
//            console.log("key:" + hash);
            sock.write(handshake);
			sendStrWS(sock, "OK Open");
        }
        else
		{
			var get_regex = /GET (.*)HTTP/g;
			var getdir = get_regex.exec(data);
			if(getdir !==null)
			{
				console.log("get dir");
				var resp = "HTTP/1.1 200 OK\r\n"+
					"Content-Type: text/html\r\n"+
					"Connection: Close\r\n"+
					"\r\n"+
					httpagestr();
				
				sock.end(resp);	
			}
			else
			{
				var strget = getDataWS(data);
				console.log("get wsString: " + strget);
				sendStrWS(sock, reverse(strget));
			}
		}
    });
    
    // Add a 'close' event handler to this instance of socket
    sock.on('close', function(data) {
        console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
    });
    sock.on('error', function (exc) {
		console.log("ignoring exception: " + exc);
	});
}).listen(PORT, HOST);

console.log('Server listening on ' + HOST +':'+ PORT);
