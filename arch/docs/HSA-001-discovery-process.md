# High-Level Solution Architecture: API Discovery Process #

## Process ##

  1. API Service CD Pipe registers its root URL with the API Discovery Service (ADS)
    - need a HTTP POST endpoint to register a service deployment and provide Swagger Doc URL
      - e.g. POST /services/registerDeployment
  2. ADS makes call to Swagger Doc URL and stores response document
  3. Validation is run on Swagger Doc to ensure it is parsable
  4. If valid, the Swagger Doc is processed into parts (paths, entities)
  5. Document Repository is committed and Pushed to remote
