var util = require('util'),
  graphviz = require('graphviz');

var csv = require('csv');
var fs = require('fs');

//Create digraph G
var g = graphviz.digraph("G");

// transliterate function from http://stackoverflow.com/questions/11404047/transliterating-cyrillic-to-latin-with-javascript-function
var a = {"Ё":"YO","Й":"I","Ц":"TS","У":"U","К":"K","Е":"E","Н":"N","Г":"G","Ш":"SH","Щ":"SCH","З":"Z","Х":"H","Ъ":"'","ё":"yo","й":"i","ц":"ts","у":"u","к":"k","е":"e","н":"n","г":"g","ш":"sh","щ":"sch","з":"z","х":"h","ъ":"'","Ф":"F","Ы":"I","В":"V","А":"a","П":"P","Р":"R","О":"O","Л":"L","Д":"D","Ж":"ZH","Э":"E","ф":"f","ы":"i","в":"v","а":"a","п":"p","р":"r","о":"o","л":"l","д":"d","ж":"zh","э":"e","Я":"Ya","Ч":"CH","С":"S","М":"M","И":"I","Т":"T","Ь":"'","Б":"B","Ю":"YU","я":"ya","ч":"ch","с":"s","м":"m","и":"i","т":"t","ь":"'","б":"b","ю":"yu"};

function translit(word){
  return word.split('').map(function (char) {
    return a[char] || char;
  }).join("");
}

// wordwrap function from http://james.padolsey.com/javascript/wordwrap-for-javascript/
function wordwrap( str, width, brk, cut ) {
	 
    brk = brk || '\n';
    width = width || 75;
    cut = cut || false;
 
    if (!str) { return str; }
 
    var regex = '.{1,' +width+ '}(\\s|$)' + (cut ? '|.{' +width+ '}|.+$' : '|\\S+?(\\s|$)');
 
    return str.match( RegExp(regex, 'g') ).join( brk );
 
}
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
.from.stream(fs.createReadStream(__dirname+'/db.txt'), { delimiter : '|'})
.on('record', function(row,index){
	
	// create dissertation ID if it is missing
  var diss_id = row[0].replace(/\s+/g, "") || "$" +
  	translit(row[1]) +
  	translit(row[2].substring(0,1)) +
  	translit(row[3].substring(0,1)) +
	(row[27].replace(/\s+/g, "") ? (row[27].split(" "))[2] : "NoYear");
  
  var disser_node = g.addNode( diss_id, {
	  "label" : wordwrap(row[4].replace(/\"/g, "'").replace(/\n/g, " "), 30, '\\n'), 
	  "shape" : "box" }
  );
  disser_node.set( "style", "filled" );

  console.log('#'+index+' '+ '-' + ' '+JSON.stringify(diss_id));

  // expects 3-element array of ФИО
  function add_person_node( ФИО ) {

	  return g.addNode( translit(ФИО.join('')), {
		  "label" : ФИО.join('\\n')
	  } );
	  
  }
  
  var author_node = add_person_node(row.slice(1,4));
  g.addEdge( author_node, disser_node );
  
  var adv1_node = add_person_node(row.slice(8,11));
  g.addEdge( adv1_node, disser_node );

  var adv2_node = add_person_node(row.slice(11,14));
  g.addEdge( adv2_node, disser_node );

//  var opp1_node = add_person_node(row.slice(14,17));
//  g.addEdge( opp1_node, disser_node );
//
//  var opp2_node = add_person_node(row.slice(17,20));
//  g.addEdge( opp2_node, disser_node );
//
//  var opp3_node = add_person_node(row.slice(20,24));
//  g.addEdge( opp3_node, disser_node );
})
.on('error', function(error){
  console.log(error.message);
}).on('end', function(){
	// Print the dot script
	fs.writeFileSync( 'dissergraph.gv', g.to_dot() );
	// Generate a PNG output
	g.output( "png", "dissergraph.png" );
	console.log('done');
});

// Set GraphViz path (if not in your path)
//g.setGraphVizPath( "/usr/local/bin" );

