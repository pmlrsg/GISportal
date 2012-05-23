<%@ WebHandler Language="C#" Class="xDomainProxy" %>

using System;
using System.Web;

public class xDomainProxy : IHttpHandler {
    
    public void ProcessRequest (HttpContext context) {

        //OpenLayers.ProxyHost = 'xdomainProxy.aspx?url=' so the requested url is passed in a url param
        string requestUrl = HttpUtility.UrlDecode(context.Request.QueryString["url"]);

        //test if the request string was passed and of so request data from the destination server
        if (requestUrl != null)
        {
            //create a new HttpWebRequest
            System.Net.HttpWebRequest webRequest;
            webRequest = (System.Net.HttpWebRequest)System.Net.HttpWebRequest.Create(requestUrl);
            webRequest.Method = "GET";

            System.Net.HttpWebResponse response = (System.Net.HttpWebResponse)webRequest.GetResponse();

            //check if the data was successfully retrieved
            if (response.StatusCode.ToString().ToLower() == "ok")
            {
                //set the appropriate response content type
                context.Response.ContentType = response.ContentType;

                //Read the stream associated with the response.
                System.IO.StreamReader reader = new System.IO.StreamReader(response.GetResponseStream());

                //and write it to response
                context.Response.Write(reader.ReadToEnd());
            }
        }
    }
 
    public bool IsReusable {
        get {
            return false;
        }
    }
}