var pageobj   = require("webpage").create(),
    prefix    = "http://www.familiestyrelsen.dk/samliv/navne/soeginavnelister/godkendtefornavne/",
    type,
    address,
    isrunning = true,
    names     = [],
    outfile,
    fs        = require('fs');

if (phantom.args.length != 2) {
	console.log("Usage: names.js <nametype> <outfile>");
	console.log("\nAvailable nametypes:");
	console.log("\tpigenavne");
	console.log("\tdrengenavne");
	console.log("\tunisexnavne\n");

	phantom.exit();
}

type    = phantom.args[0];
outfile = phantom.args[1];

switch (type) {
	case "pigenavne":
	case "drengenavne":
	case "unisexnavne":
		break;
	default:
		console.log("Ugyldig navnetype.");
		phantom.exit();
}

address = prefix + type + "/";

pageobj.open(address, function(status) {
	process_page(pageobj);
});

function process_page(page) {
	page_names = page.evaluate(function() {
		var page_names = [];
		jQuery("div.items div").each(function() {
			page_names.push(jQuery(this).text().trim());
		});

		return page_names;
	});

	names.push.apply(names, page_names);

	has_nextbutton = page.evaluate(function() {
		return jQuery("#tx_lfnamelists_pi2_next.enabled").length == 1;
	});

	if (has_nextbutton) {
		page.evaluate(function() {
			$('#tx_lfnamelists_pi2_gotopage').val(parseInt($('#tx_lfnamelists_pi2_page').val()));
			$('form#tx_lfnamelists_pi2_form').submit();
		});

		page.onLoad = function() { process_page(page); }
	}
	else
	{
		isrunning = false;

		console.log(names.length + " names found. Saving to " + outfile + ".");
		fs.write(outfile, names.join("\n"), "w");
		console.log("Done saving.");
		phantom.exit(0);
	}
}
