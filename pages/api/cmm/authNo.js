import {hash} from "../../../util/securityUtil";
import {result} from "../db";

export default async function AuthNo(req, res) {

    const param = req.body;

    res.status(200).json(result(hash(param.cetino) === param.authNoHash));
}