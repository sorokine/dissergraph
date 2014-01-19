var util = require('util'),
  graphviz = require('graphviz');

var csv = require('csv');
var fs = require('fs');

//Create digraph G
var g = graphviz.digraph("G");

var cyr_lat = {"Ё":"YO","Й":"I","Ц":"TS","У":"U","К":"K","Е":"E","Н":"N","Г":"G","Ш":"SH","Щ":"SCH","З":"Z","Х":"H","Ъ":"'","ё":"yo","й":"i","ц":"ts","у":"u","к":"k","е":"e","н":"n","г":"g","ш":"sh","щ":"sch","з":"z","х":"h","ъ":"'","Ф":"F","Ы":"I","В":"V","А":"a","П":"P","Р":"R","О":"O","Л":"L","Д":"D","Ж":"ZH","Э":"E","ф":"f","ы":"i","в":"v","а":"a","п":"p","р":"r","о":"o","л":"l","д":"d","ж":"zh","э":"e","Я":"Ya","Ч":"CH","С":"S","М":"M","И":"I","Т":"T","Ь":"'","Б":"B","Ю":"YU","я":"ya","ч":"ch","с":"s","м":"m","и":"i","т":"t","ь":"'","б":"b","ю":"yu"};

/**
 * Transliterate cyrillic to latin
 * from http://stackoverflow.com/questions/11404047/transliterating-cyrillic-to-latin-with-javascript-function
 * @param word
 * @returns
 */
function translit(word){
  return word.split('').map(function (char) {
    return cyr_lat[char] || char;
  }).join("");
}

/**
 * wordwrap function from http://james.padolsey.com/javascript/wordwrap-for-javascript/
 */
function wordwrap( str, width, brk, cut ) {
	 
    brk = brk || '\n';
    width = width || 75;
    cut = cut || false;
 
    if (!str) { return str; }
 
    var regex = '.{1,' +width+ '}(\\s|$)' + (cut ? '|.{' +width+ '}|.+$' : '|\\S+?(\\s|$)');
 
    return str.match( RegExp(regex, 'g') ).join( brk );
 
}

var stream = require('stream');
var filter = new stream.Transform( { objectMode: true } );
 
filter._transform = function (chunk, encoding, done) {
     var str = chunk.toString();
     this.push(str.replace(/\r/g, ' '));
     done();
};

/**
 * CSV record
 * 
 *  0          1. Имя файла на сервере
    1          2. Фамилия автора
    2          3. Имя автора
    3          4. Отчество автора
    4          5. Название диссера
    5          6. Код ВАК
    6          7. Полное имя организации, где выполнена работа
    7          8. Сокращенное имя организации, где выполнена работа
    8  9 10    9-10 ФИО 1-го научного руководителя или консультанта
   11 12 13    11-13 ФИО 2-го научного руководителя или консультанта
   14 15 16    14-16 ФИО 1-го оппонента
   17 18 19    17-19 ФИО 2-го оппонента
   20 21 22    20-22 ФИО 3-го оппонента
   23          23 Полное имя ведущей организации
   24          24 Сокращенное имя ведущей организации
   25          25 дата защиты
   26          26 место защиты
   27          27 место защиты (сокращенное)
   28          28 номер диссертационного совета

 */

csv()
.from.stream(fs.createReadStream(__dirname+'/db.txt').pipe(filter), { delimiter : '|'})
.on('record', function(row,index){
	
	// create dissertation ID if it is missing
  var diss_id = row[0].replace(/\s+/g, "") || "$" +
  	translit(row[1]) +
  	translit(row[2].substring(0,1)) +
  	translit(row[3].substring(0,1)) +
	(row[27].replace(/\s+/g, "") ? (row[27].split(" "))[2] : "NoYear");
  
  var diss_title = row[4].replace(/\"/g, "'").replace(/\n/g, " ");
//  var disser_node = g.addNode( diss_id, {
//	  "label" : wordwrap(row[4].replace(/\"/g, "'").replace(/\n/g, " "), 30, '\\n'), 
//	  "shape" : "box" }
//  );
//  disser_node.set( "style", "filled" );

  console.log('#'+index+' '+ '-' + ' '+JSON.stringify(diss_id) + ' ' + row.slice(16,19));

  // expects 3-element array of ФИО
  function add_person_node( ФИО ) {

	  ФИО[0] = ФИО[0].replace(/нет( данных)?/i, '')
	  if (ФИО[0].replace(/\s+/g, "")) 
		  return g.addNode( translit(ФИО.join('')), {
			  "tooltip" : ФИО.join(' '),
			  "shape" : "circle",
			  "fixedsize" : "yes",
			  "height" : "0.2",
			  "width" : "0.2",
			  "label" : '',
			  "style" : "filled"
		  } );
	  else
		  return null;
  }
  
  var author_node = add_person_node(row.slice(1,4));
  //g.addEdge( author_node, disser_node, { "penwidth" : "3"} );
  
  var adv1_node = add_person_node(row.slice(10,13));
  if (adv1_node) g.addEdge( adv1_node, author_node, { "penwidth" : "3", "color" : "green", "tooltip" : "руковод. " + diss_title} );

  var adv2_node = add_person_node(row.slice(13,16));
  if (adv2_node) g.addEdge( adv2_node, author_node, { "penwidth" : "2", "color" : "green", "tooltip" : "руковод. " + diss_title} );

  var opp1_node = add_person_node(row.slice(16,19));
  if (opp1_node) g.addEdge( opp1_node, author_node, { "color" : "red", "tooltip" : "оппон. " + diss_title } );

  var opp2_node = add_person_node(row.slice(19,22));
  if (opp2_node) g.addEdge( opp2_node, author_node, { "color" : "red", "tooltip" : "оппон. " + diss_title} );

  var opp3_node = add_person_node(row.slice(22,25));
  if (opp3_node) g.addEdge( opp3_node, author_node, { "color" : "red", "tooltip" : "оппон. " + diss_title} );
})
.on('error', function(error){
  console.log(error.message);
}).on('end', function(){
	// Print the dot script
	fs.writeFileSync( 'dissergraph.gv', g.to_dot() );
	// Generate a other outputs
	//g.output( "svg", "dissergraph.svg" );
	console.log('done');
});

// Set GraphViz path (if not in your path)
//g.setGraphVizPath( "/usr/local/bin" );

