<?php

	require_once('rpcConfig.php');
	require_once('libs/easybitcoin.php');

	$bitcoin = new Bitcoin($rpcUsername, $rpcPassword, $rpcHost, $rpcPort, $rpcProto);
	$bitcoin->getpeerinfo();
	$jsonRes = json_decode($bitcoin->raw_response);

	$connections = array();
	$connections["in"] = array();
	$connections["out"] = array();

	for ($i = 0; $i < count($jsonRes->result); $i++) {
		$c = $jsonRes->result[$i];
		$a = $c->addr;
		$v = $c->subver;
		$arr1 = explode(":", $a);
		
		$con = array();
		$con["ip"] = "";
		$con["ver"] = "";
		
		// skipping ipv6 for now
		if (count($arr1) === 2) { 						// ipv4
			if ($arr1[1] === "8333") { 					// outbound con
				$con["ip"] = $arr1[0];
				$con["ver"] = $v;
				$connections["out"][] = $con;
			} else { 							// inbound con
				$con["ip"] = $arr1[0];
				$con["ver"] = $v;
				$connections["in"][] = $con;
			}
		} else { 								//ipv6
			continue;
		}
	}

	echo json_encode($connections);

?>
