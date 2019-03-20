/*global chrome*/
import React, { Component } from 'react';
import {
  Button,
  Col,
  Container,
  Form,
  ListGroup,
  Row,
  Table
} from 'react-bootstrap';
import Axios from 'axios';
import Api from './utils/api';

class App extends Component {
  constructor(props) {
    super(props);
    chrome.runtime.sendMessage({ action: 'popupOpen' });

    this.state = {
      resumeCount: 0,
      mailCount: 0,
      smsCount: 0,
      history: {},
      candidate: {},
      ratings: [],
      positions: [],
      selectedPosition: null,
      positionDetail: '',
      memo: [],
      newNote: '',
      mail: {
        title: '',
        content:
          '안녕하세요, \n간략히 검토후 의향에 대해서 회신 주시면 감사하겠습니다.',
        sign: `\n커리어셀파 헤드헌터 강상모 \n+82 010 3929 7682 \nwww.careersherpa.co.kr`
      },
      sms: {
        content: `안녕하세요 ${
          this.selectedPosition
        }으로 제안드리오니 메일 검토를 부탁드리겠습니다. 감사합니다.`,
        sign: '\n커리어셀파 강상모 드림. 010-3929-7682'
      },
      fetchingCrawlingData: false,
      validatedMail: false,
      validatedSms: false,
      validatedMemo: false,
      user: {},
      url: '',
      records: [],
      mailList: [],
      mailKey: 0
    };
  }

  componentDidMount() {
    this.fetchUser();
    this.getResumeCount();
    this.getCount('mailCount');
    this.getCount('smsCount');
    this.fetchPosition();
    this.loadExistingCandidateData();
  }

  fetchUser = async () => {
    try {
      await chrome.storage.local.get(['user', 'saved', 'url'], response => {
        if (response.user && response.user.check === true) {
          this.setState({
            user: response.user
          });
        }
      });
    } catch (err) {
      alert('failed to fetch user', err);
    }
  };

  fetchPosition = async () => {
    try {
      const positions = await Axios.post(Api.getPosition, {
        user_id: this.state.user.user_email
      });
      this.setState({ positions });
    } catch (err) {
      alert('failed to fetch positions', err);
    }
  };

  fetchPositionDetail = () => {
    const { selectedPosition } = this.state;
    const positions = this.state.positions.data.result;
    for (let i = 0; i < positions.length; i++) {
      if (selectedPosition.includes(positions[i].title)) {
        this.setState({ positionDetail: positions[i].detail });
        break;
      }
    }
    this.updateSmsContent();
  };

  memoSubmit = event => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    }
    event.preventDefault();
    this.setState({ validatedMemo: true });
    this.writeMemo(this.state.newNote, this.state.selectedPosition);
  };

  writeMemo = async (body, position) => {
    try {
      await Axios.post(Api.writeMemo, {
        user_id: this.state.user.user_id,
        rm_code: this.state.candidate.rm_code,
        position: position,
        body: `${position} | ${this.state.user.user_name} 헤드헌터 | ${body}`,
        client: 'chrome-extension'
      });
      await this.viewMemo();
    } catch (err) {
      console.log(err);
    }
  };

  viewMemo = async () => {
    const memo = await Axios.post(Api.getMemo, {
      user_id: this.state.user.user_id,
      rm_code: this.state.candidate.rm_code
    });
    this.setState({ memo: memo.data.result });
  };

  deleteMemo = async memo_id => {
    // still testing
    const memo = await Axios.post(Api.deleteMemo, {
      user_id: this.state.user.user_id,
      memo_id
    });
    try {
      memo();
      await this.viewMemo();
    } catch (error) {
      alert(error);
    }
  };

  fetchMail = async () => {
    try {
      const mails = await Axios.post(Api.getMail, {
        user_id: this.state.user.user_id,
        rm_code: this.state.candidate.rm_code,
        email: this.state.candidate.email
      });
      this.setState(prevState => ({
        mailList: [...prevState.mailList, mails.data.result]
      }));
    } catch (err) {
      alert(err);
    }
  };

  nextMail = async () => {
    try {
      const { mailKey, mailList } = this.state;
      if (mailKey === 0 && mailList[0][0]) {
        const { body, client, position } = mailList[0][0];
        this.setState(prevState => ({
          selectedPosition: position,
          mail: {
            title: `${client} | ${position}`,
            content: body,
            sign: `\n커리어셀파 헤드헌터 강상모 \n+82 010 3929 7682 \nwww.careersherpa.co.kr`
          },
          mailKey: prevState.mailKey + 1
        }));
        alert('메일을 불러왔습니다');
      } else if (mailKey > 0 && mailList[0][mailKey]) {
        const { body, client, position } = mailList[0][mailKey];
        this.setState(prevState => ({
          selectedPosition: position,
          mail: {
            title: `${client} | ${position}`,
            content: body,
            sign: `\n커리어셀파 헤드헌터 강상모 \n+82 010 3929 7682 \nwww.careersherpa.co.kr`
          },
          mailKey: prevState.mailKey + 1
        }));
        alert('이메일을 불러왔습니다');
      } else {
        alert('더 이상 메일이 없습니다');
      }
    } catch (err) {
      alert(err);
    }
  };

  priorMail = async () => {
    try {
      const { mailKey, mailList } = this.state;
      if (mailKey === 0 && mailList[0][0]) {
        const { body, client, position } = mailList[0][0];
        this.setState(prevState => ({
          selectedPosition: position,
          mail: {
            title: `${client} | ${position}`,
            content: body,
            sign: `\n커리어셀파 헤드헌터 강상모 \n+82 010 3929 7682 \nwww.careersherpa.co.kr`
          }
        }));
        alert('메일을 불러왔습니다');
      }
      if (mailKey > 0 && mailList[0][mailKey - 1]) {
        const { body, client, position } = mailList[0][mailKey - 1];
        this.setState(prevState => ({
          selectedPosition: position,
          mail: {
            title: `${client} | ${position}`,
            content: body,
            sign: `\n커리어셀파 헤드헌터 강상모 \n+82 010 3929 7682 \nwww.careersherpa.co.kr`
          },
          mailKey: prevState.mailKey - 1
        }));
        alert('이메일을 불러왔습니다');
      } else {
        alert('더 이상 메일이 없습니다');
      }
    } catch (err) {
      alert(err);
    }
  };

  mailSubmit = event => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      event.preventDefault();
      this.setState({ validatedMail: true, mailKey: 0 });
      this.sendMail();
    }
  };

  sendMail = () => {
    Axios.post(Api.sendMail, {
      user_id: this.state.user.user_id,
      rm_code: this.state.candidate.rm_code,
      sender: this.state.user.user_email,
      recipient: this.state.candidate.email,
      subject: this.state.mail.title,
      body:
        this.state.mail.content +
        '\n\n' +
        '[Position Detail]\n\n' +
        this.state.positionDetail +
        '\n\n' +
        this.state.mail.sign,
      position: this.state.selectedPosition
    });
    this.addCount('mailCount');
  };

  updateSmsContent = () => {
    this.setState({
      sms: {
        ...this.sms,
        content: `안녕하세요 ${
          this.state.selectedPosition
        }으로 제안드리오니 메일 검토를 부탁드리겠습니다. 감사합니다.`,
        sign: '\n커리어셀파 강상모 드림. 010-3929-7682'
      }
    });
  };

  smsSubmit = event => {
    const form = event.currentTarget;
    if (form.checkValidity() === false) {
      event.preventDefault();
      event.stopPropagation();
    } else {
      event.preventDefault();
      this.setState({ validatedSms: true });
      this.sendSMS();
    }
  };

  sendSMS = () => {
    Axios.post(Api.sendSMS, {
      user_id: this.state.user.user_id,
      rm_code: this.state.candidate.rm_code,
      recipient: this.state.candidate.mobile,
      body: this.state.sms.content,
      position: this.state.selectedPosition
    });
    this.addCount('smsCount');
  };

  getResumeCount = () => {
    const storage = chrome.storage.local;
    storage.get('resumeCount', result => {
      this.setState({ resumeCount: result.resumeCount });
    });
  };

  getCount = key => {
    const storage = chrome.storage.local;
    storage.get(key, result => {
      const currCount = result[key];
      this.setState({ [key]: currCount });
    });
  };

  addCount = key => {
    chrome.storage.local.get(key, async result => {
      if (result[key]) {
        const currCount = result[key];
        await chrome.storage.local.set({ [key]: currCount + 1 }, () => {
          this.setState({ [key]: currCount + 1 });
        });
      } else {
        await chrome.storage.local.set({ [key]: 1 }, () => {
          this.setState({ [key]: 1 });
        });
      }
      alert('송부되었습니다!');
    });
  };

  loadExistingCandidateData = () => {
    var port = chrome.extension.connect({
      name: 'Load Existing Candidate Data Communication'
    });
    port.postMessage('Requesting existing candidate data');
    port.onMessage.addListener(saved => {
      const sortRatings = saved.rate.sort((a, b) => {
        return b.score - a.score;
      });
      this.setState({
        candidate: saved,
        ratings: sortRatings,
        fetchingCrawlingData: true
      });
      this.fetchMail();
    });
  };

  reset = () => {
    var port = chrome.extension.connect({
      name: 'Resetting Communication'
    });
    port.postMessage('Requesting reset');
    this.setState({
      resumeCount: 0,
      mailCount: 0,
      smsCount: 0
    });
  };

  crawling = () => {
    this.setState({ fetchingCrawlingData: true });
    var port = chrome.extension.connect({
      name: 'Crawling Communication'
    });
    port.postMessage('Requesting crawling');
    port.onMessage.addListener(response => {
      if (response.user && response.user.check === true) {
        const sortRatings = response.candidate.rate.sort((a, b) => {
          return b.score - a.score;
        });
        this.fetchMail();
        this.setState({
          user: response.user,
          history: response.history,
          candidate: response.candidate,
          ratings: sortRatings,

          fetchingCrawlingData: false,
          resumeCount: response.resumeCount
        });
      } else {
        alert('Unauthorized user');
        this.setState({ fetchingCrawlingData: false });
      }
    });
  };

  setPosition = selectedPosition => {
    this.setState({ selectedPosition }, () => this.fetchPositionDetail());
    alert(selectedPosition);
  };

  render() {
    const {
      resumeCount,
      mailCount,
      smsCount,
      candidate,
      ratings,
      positionDetail,
      selectedPosition,
      memo,
      mail,
      sms,
      validatedMail,
      validatedSms,
      validatedMemo,
      user,
      history
    } = this.state;

    return (
      <Container>
        <Row>
          <Col className="pullRight">
            {this.state.fetchingCrawlingData ? (
              <Button
                variant="outline-danger"
                size="sm"
                style={{ float: 'right' }}
                disabled
              >
                저장
              </Button>
            ) : (
              <Button
                variant="outline-danger"
                size="sm"
                style={{ float: 'right' }}
                onClick={this.crawling}
              >
                저장
              </Button>
            )}
          </Col>
        </Row>

        <Row>
          <Col>
            <details open={true}>
              <summary>[적합도]</summary>
              <br />
              <div style={{ fontSize: '0.75em' }}>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Title</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  {ratings
                    ? ratings.map(rate => {
                        return (
                          <tbody>
                            <tr>
                              <td>{rate.company}</td>
                              <td onClick={() => this.setPosition(rate.title)}>
                                {rate.title}
                              </td>
                              <td>{rate.score}</td>
                            </tr>
                          </tbody>
                        );
                      })
                    : null}
                </Table>
              </div>
            </details>
          </Col>
        </Row>

        <hr />

        <Row>
          <Col>
            <details open={true}>
              <summary>[SMS]</summary>
              <br />
              <Form
                noValidate
                validated={validatedSms}
                onSubmit={e => this.smsSubmit(e)}
              >
                <Form.Group as={Row} controlId="smsRecipient">
                  <Form.Label column sm={2}>
                    수신인
                  </Form.Label>
                  <Col sm={10}>
                    <Form.Control
                      size="sm"
                      value={
                        candidate && candidate.mobile ? candidate.mobile : null
                      }
                      onChange={event =>
                        this.setState({
                          candidate: {
                            ...candidate,
                            mobile: event.target.value
                          }
                        })
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      전화번호를 입력해주세요.
                    </Form.Control.Feedback>
                  </Col>
                </Form.Group>

                <Form.Group as={Row} controlId="smsContent">
                  <Form.Label column sm={2}>
                    내용
                  </Form.Label>
                  <Col sm={10}>
                    <Form.Control
                      as="textarea"
                      size="sm"
                      rows="2"
                      required
                      value={sms.content}
                      onChange={event =>
                        this.setState({
                          sms: {
                            ...sms,
                            content: event.target.value
                          }
                        })
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      문자를 입력해주세요.
                    </Form.Control.Feedback>
                  </Col>
                </Form.Group>

                <Form.Group as={Row}>
                  <Col sm={9} />
                  <Button column sm={2} size="sm" variant="outline-warning">
                    <i className="fas fa-arrow-left" />
                  </Button>
                  <Col sm={2}>
                    <Button column sm={2} size="sm" variant="outline-warning">
                      <i className="fas fa-arrow-right" />
                    </Button>
                  </Col>
                </Form.Group>
                <Button type="submit" block size="sm">
                  <i class="fas fa-comment"> 문자 보내기</i>
                </Button>
              </Form>
            </details>
          </Col>
        </Row>

        <hr />

        <Row>
          <Col>
            <details>
              <summary>[Mail]</summary>
              <br />
              <Form
                noValidate
                validated={validatedMail}
                onSubmit={e => this.mailSubmit(e)}
              >
                <Form.Group as={Row} controlId="emailRecipient">
                  <Form.Label column sm={2}>
                    수신인
                  </Form.Label>
                  <Col sm={10}>
                    <Form.Control
                      size="sm"
                      required
                      value={
                        candidate && candidate.email ? candidate.email : null
                      }
                      onChange={event =>
                        this.setState({
                          candidate: {
                            ...candidate,
                            email: event.target.value
                          }
                        })
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      이메일을 입력해주세요.
                    </Form.Control.Feedback>
                  </Col>
                </Form.Group>

                <Form.Group as={Row} controlId="mailTitle">
                  <Form.Label column sm={2}>
                    제목
                  </Form.Label>
                  <Col sm={10}>
                    <Form.Control
                      type="text"
                      size="sm"
                      required
                      value={selectedPosition}
                      onChange={event =>
                        this.setState({
                          mail: {
                            ...mail,
                            title: event.target.value
                          }
                        })
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      메일 제목을 작성해주세요.
                    </Form.Control.Feedback>
                  </Col>
                </Form.Group>
                <Form.Group as={Row} controlId="mailContent">
                  <Form.Label column sm={2}>
                    내용
                  </Form.Label>
                  <Col sm={10}>
                    <Form.Control
                      as="textarea"
                      size="sm"
                      rows="2"
                      required
                      value={mail.content}
                      onChange={event =>
                        this.setState({
                          mail: {
                            ...mail,
                            content: event.target.value
                          }
                        })
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      메일을 작성해주세요.
                    </Form.Control.Feedback>
                  </Col>
                </Form.Group>
                <Form.Group as={Row}>
                  <Col sm={9} />
                  <Button
                    onClick={this.priorMail}
                    column
                    sm={2}
                    size="sm"
                    variant="outline-warning"
                  >
                    <i className="fas fa-arrow-left" />
                  </Button>
                  <Col sm={2}>
                    <Button
                      onClick={this.nextMail}
                      column
                      sm={2}
                      size="sm"
                      variant="outline-warning"
                    >
                      <i className="fas fa-arrow-right" />
                    </Button>
                  </Col>
                </Form.Group>

                <Form.Group as={Row} controlId="mailPositionDetail">
                  <Form.Label column sm={2}>
                    디테일
                  </Form.Label>
                  <Col sm={10}>
                    <Form.Control
                      as="textarea"
                      size="sm"
                      rows="3"
                      required
                      value={positionDetail || '디테일 없음'}
                      onChange={event =>
                        this.setState({
                          positionDetail: event.target.value
                        })
                      }
                    />
                    <Form.Control.Feedback type="invalid">
                      포지션 디테일을 작성해주세요.
                    </Form.Control.Feedback>
                  </Col>
                </Form.Group>
                <Button type="submit" block size="sm">
                  <i class="fas fa-envelope"> 메일 보내기</i>
                </Button>
              </Form>
            </details>
          </Col>
        </Row>

        <hr />

        <Row>
          <Col>
            <Form
              noValidate
              validated={validatedMemo}
              onSubmit={e => this.memoSubmit(e)}
            >
              <Form.Row>
                <Form.Group as={Col} controlId="validationMemo">
                  <Form.Control
                    type="text"
                    size="sm"
                    placeholder="메모"
                    required
                    onChange={event =>
                      this.setState({ newNote: event.target.value })
                    }
                  />
                  <Form.Control.Feedback type="invalid">
                    메모를 작성해주세요.
                  </Form.Control.Feedback>
                </Form.Group>

                <div>
                  <Button type="submit" size="sm" inline>
                    입력
                  </Button>
                  <Button onClick={this.viewMemo} size="sm">
                    조회
                  </Button>
                </div>
              </Form.Row>
            </Form>
            <hr />
          </Col>
        </Row>
        <Row>
          <Col>
            <ListGroup>
              {memo && memo.length && Array.isArray(memo) ? (
                memo.map(line => {
                  return (
                    <ListGroup.Item
                      variant="dark"
                      className="p-1"
                      style={{ fontSize: 14 }}
                      action
                    >
                      {line.note}
                      <Button
                        size="sm"
                        onClick={() => this.deleteMemo(line.memo_id)}
                      >
                        삭제
                      </Button>
                    </ListGroup.Item>
                  );
                })
              ) : (
                <ListGroup.Item
                  action
                  variant="dark"
                  className="p-1"
                  style={{ fontSize: 14 }}
                >
                  메모가 없습니다
                </ListGroup.Item>
              )}
            </ListGroup>
          </Col>
        </Row>
        <hr />
        <Row>
          <Col>[History]</Col>
        </Row>
        <Row>
          <Col>
            {history && history.result
              ? history.result.map(each => {
                  return <p>{each}</p>;
                })
              : 'new candidate'}
          </Col>
        </Row>
        <hr />
        <Row>
          <Col>Resume: {resumeCount || 0}</Col>
          <Col>Mail: {mailCount}</Col>
          <Col>SMS: {smsCount}</Col>
          <Col className="text-right">
            {user.user_name || 'Unauthorized User'}
          </Col>
        </Row>
        <br />
        <Row>
          <Col>
            {this.state.fetchingCrawlingData ? (
              <Button
                variant="outline-warning"
                block
                size="sm"
                onClick={this.reset}
                disabled
              >
                초기화
              </Button>
            ) : (
              <Button
                variant="outline-secondary"
                block
                size="sm"
                onClick={this.reset}
              >
                초기화
              </Button>
            )}
          </Col>
        </Row>
      </Container>
    );
  }
}

export default App;
