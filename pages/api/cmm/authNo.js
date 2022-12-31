import {hash} from "../../../util/securityUtil";

export default async function AuthNo(req, res) {

    const param = req.body;

    res.status(200).json(hash(param.cetino) === param.authNoHash);
}