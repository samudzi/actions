import * as chai from "chai"
import * as sinon from "sinon"

import * as D from "../../../src/framework"

import { TwilioMessageAction } from "./twilio_message"

const integration = new TwilioMessageAction()

function expectTwilioMatch(request: D.ActionRequest, match: any) {

  const createSpy = sinon.spy(async () => Promise.resolve())

  const stubClient = sinon.stub(integration as any, "twilioClientFromRequest")
    .callsFake(() => ({
      messages: {create: createSpy},
    }))

  const action = integration.execute(request)
  return chai.expect(action).to.be.fulfilled.then(() => {
    chai.expect(createSpy).to.have.been.calledWithMatch(match)
    stubClient.restore()
  })
}

describe(`${integration.constructor.name} unit tests`, () => {

  describe("action", () => {

    it("errors if there is no phone tag", () => {
      const request = new D.ActionRequest()
      request.type = D.ActionType.Query
      request.formParams = {
        message: "My Message",
      }

      request.attachment = {dataJSON: {
        fields: [{name: "coolfield"}],
        data: [
          {coolfield: {value: "12122222222"}},
        ],
      }}

      const action = integration.execute(request)

      return chai.expect(action).to.eventually
        .be.rejectedWith("Query requires a field tagged phone.")
    })

    it("errors if the input has no message", () => {
      const request = new D.ActionRequest()
      request.formParams = {}
      request.attachment = {dataJSON: {
        fields: [{name: "coolfield", tags: ["phone"]}],
        data: [
          {coolfield: {value: "12122222222"}},
          {coolfield: {value: "12122222223"}},
        ],
      }}

      return chai.expect(integration.execute(request)).to.eventually
        .be.rejectedWith("Need a message.")
    })

    it("sends right body", () => {
      const request = new D.ActionRequest()
      request.type = D.ActionType.Query
      request.params = {
        from: "fromphone",
      }
      request.formParams = {
        message: "My Message",
      }
      request.attachment = {dataJSON: {
        fields: [{name: "coolfield", tags: ["phone"]}],
        data: [
          {coolfield: {value: "12122222222"}},
        ],
      }}
      return expectTwilioMatch(request, {
        to: "12122222222",
        body: request.formParams.message,
        from: "fromphone",
      })
    })

    it("errors if there is no attachment for cell", () => {
      const request = new D.ActionRequest()
      request.type = D.ActionType.Cell
      request.params = {
        from: "fromphone",
      }
      request.formParams = {
        message: "My Message",
      }
      const action = integration.execute(request)

      return chai.expect(action).to.eventually
        .be.rejectedWith("Couldn't get data from cell.")
    })

    it("sends right params for cell", () => {
      const request = new D.ActionRequest()
      request.type = D.ActionType.Cell
      request.params = {
        from: "fromphone",
        value: "12122222222",
      }
      request.formParams = {
        message: "My Message",
      }
      return expectTwilioMatch(request, {
        to: "12122222222",
        body: request.formParams.message,
        from: "fromphone",
      })
    })

  })

  describe("form", () => {

    it("has form", () => {
      chai.expect(integration.hasForm).equals(true)
    })

  })

})
