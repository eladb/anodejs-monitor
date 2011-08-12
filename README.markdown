This service is an HTTP ping service that pings a set of targets once in a while and collects ping stats.
It also has a UX that shows latency graph for a specified target.

See code for API (sorry).

# TBD

We want to evolve this service to become a fully fledged black box test suite for services.
The idea is that I will be able to write a set of black-box tests (which basically send HTTP requests to a service and verify that the results are as expected). This test suite will be run continuously against some predefined endpoint (e.g. test.myservice.anodejs.org) and report via POST callbacks on any failures or successes.
This will be used as part of the cont. deployment gating process to gate moving a service to production.

Notes:

* It should be possible to trigger tests via an API call.
* It should be very easy to write tests against a service.
* The testing language *must* be standard and use existing libraries.
* Tests should run in parallel on multiple instances and distributed so that we can scale infinitely to thousands of tests against hundreds of services running in O(1) -> obviously this will require multiple instances, but we should design in such a way that adding instances will linearly scale the service (think queue + workers).
* Think of a way to decouple the test execution and the distribution mechanism so we could reuse the parallel runtime for other things (e.g. build).