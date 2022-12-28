import { APIRoute } from "next-s3-upload";

export default APIRoute.configure({
    key(req, filename) {

        return `upload/${new Date().toISOString().replace(/-/g, '').substring(0, 6)}/${Date.now().toString()}_${filename}`;
    }
});