const { toLogicalID } = require('@architect/utils');

function modifyStaticBucketSettings() {
  return {
    compression: 'gzip',
    fingerprint: false,
    folder: 'build',
    prune: false,
    spa: true,
  };
}

function getBucketLogicalID(resources) {
  for (const resource in resources) {
    if (resources[resource].Type === 'AWS::S3::Bucket') {
      return resource;
    }
  }

  throw Error(`There is no bucket found in resources.`);
}

function buildCloudFrontOAI(distributionID, bucketID) {
  return {
    Type: 'AWS::CloudFront::CloudFrontOriginAccessIdentity',
    DependsOn: bucketID,
    Properties: {
      CloudFrontOriginAccessIdentityConfig: {
        Comment: `${distributionID}-OAI`,
      },
    },
  };
}

function buildCloudFrontDistribution(originAccessIdentityID, bucketID) {
  return {
    Type: 'AWS::CloudFront::Distribution',
    DependsOn: originAccessIdentityID,
    Properties: {
      DistributionConfig: {
        DefaultCacheBehavior: {
          AllowedMethods: [ 'DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT' ],
          ForwardedValues: {
            QueryString: true,
            Cookies: { Forward: 'none' },
          },
          TargetOriginId: 'static',
          ViewerProtocolPolicy: 'allow-all',
        },
        DefaultRootObject: 'index.html',
        Enabled: true,
        Origins: [
          {
            DomainName: {
              'Fn::Sub': [ 
                '${bucket}.s3-website-${AWS::Region}.amazonaws.com', 
                { bucket: { Ref: bucketID } }
              ]
            },
            Id: 'static',
            CustomOriginConfig: {
              HTTPPort: 80,
              OriginProtocolPolicy: 'http-only'
            },
          },
        ],
        PriceClass: 'PriceClass_All',
        ViewerCertificate: { CloudFrontDefaultCertificate: true },
      },
    },
  };
}

function buildOutputForDistribution(distributionID) {
  return {
    Description: 'Distribution URL',
    Value: { 
      'Fn::GetAtt': [ distributionID, 'DomainName' ],
    },
  };
}

function deployCloudfrontDistribution({ cloudformation: cfn, inventory }) {
  const bucketID = getBucketLogicalID(cfn.Resources);
  const fwaLogicalID = toLogicalID(inventory.inv.app);
  const distributionID = `${fwaLogicalID}Distribution`;
  const originAccessIdentityID = `${fwaLogicalID}OriginAccessIdentity`;

  cfn.Resources[originAccessIdentityID] = buildCloudFrontOAI(distributionID, bucketID);

  cfn.Resources[distributionID] = buildCloudFrontDistribution(originAccessIdentityID, bucketID);

  cfn.Outputs['Distribution'] = buildOutputForDistribution(distributionID);

  return cfn;
}

module.exports = {
  set: { static: modifyStaticBucketSettings },
  deploy: { start: deployCloudfrontDistribution },
};
