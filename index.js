var Q = require('q');
var mime = require('mime');
var AWS = require('aws-sdk');
var fs = require('fs');

module.exports = function(result, options) {
  if (!result) { result = {}; }
  var def = Q.defer();

  if (!options) {
    def.reject(new Error("S3 Upload expected options object."));
  } else if (!options.dstBucket) {
    def.reject(new Error("S3 Upload expected options.dstBucket to exist"));
  } else if (!options.dstKey) {
    def.reject(new Error("S3 Upload expected options.dstKey to exist"));
  } else if (!options.uploadFilepath) {
    def.reject(new Error("S3 Upload expected options.uploadFilepath to exist"));
  } else {

    for (var key in options) {
      result[key] = options[key];
    }

    var params = {
      Bucket: options.dstBucket,
      Key: options.dstKey,
      ContentType: mime.lookup(options.uploadFilepath)
    };

    if (options.Metadata) {
      params["Metadata"] = options.Metadata;
    }

    if (options.ACL) {
      params.ACL = options.ACL;
    }

    var file = fs.createReadStream(options.uploadFilepath);

    var S3;
    if (options.region) {
      S3 = new AWS.S3({params: params, region: options.region});
    } else {
      S3 = new AWS.S3({params: params});
    }

    S3.upload({Body: file})
      .on('httpUploadProgress', function(evt) {
        console.log('Upload Progress: ' + (100 * evt.loaded / evt.total));
      })
      .send(function(err) {
        if (err) {
          def.reject(err);
        } else {
          console.log('Successfully uploaded: ', options.uploadFilepath);
          def.resolve(result);
        }
      });

  }

  return def.promise;
};
