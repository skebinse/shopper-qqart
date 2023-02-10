import { APIRoute, uuid } from "next-s3-upload";


export default APIRoute.configure({
    key(req, filename) {

        const yyyymm = new Date().toISOString().replace(/-/g, '').substring(0, 6);

        return `upload/${yyyymm.substring(0, 4)}/${yyyymm.substring(4)}/${uuid()}${filename.substring(filename.lastIndexOf('.'))}`;
    }
});