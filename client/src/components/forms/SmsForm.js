import React from 'react'
import Axios from 'axios'
import { Button, Form, Input, Select } from 'antd'
import API from '../../util/api'
import ShortId from 'shortid'

class SmsForm extends React.Component {
  state = {
    position: '',
    positionData: [],
    contentLength: 0
  }

  handleSubmit = e => {
    e.preventDefault()
    this.props.form.validateFieldsAndScroll((err, values) => {
      if (!err) {
        this.props.writeSmsContent(values)
        console.log('Received values of form: ', values)
      }
    })
  }

  handlePositionChange = value => {
    this.setState({ position: value })
  }

  fetchPosition = () => {
    Axios.post(API.getPosition, {
      user_id: this.props.user_id
    }).then(data => {
      const keyAddedResult = data.data.result.map(data => {
        data.key = ShortId.generate()
        return data
      })
      this.setState({
        positionData: keyAddedResult
      })
      console.log('position data', data.data.result)
      console.log('position data + key', keyAddedResult)
    })
  }

  contentLength = event => {
    console.log('event', event)
    this.setState({
      contentLength: event.target.value.length
    })
  }

  componentDidMount() {
    // console.log('sms 요청확인')
    this.fetchPosition()
  }

  render() {
    const { getFieldDecorator } = this.props.form
    const { selectedRows } = this.props
    const { position } = this.state

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 }
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 }
      }
    }
    const tailFormItemLayout = {
      wrapperCol: {
        xs: {
          span: 24,
          offset: 0
        },
        sm: {
          span: 16,
          offset: 8
        }
      }
    }

    let receivers =
      selectedRows.length > 1
        ? selectedRows.map((row, index) => row.name).join(',')
        : // ? selectedRows.map((row, index) => row.name).join(',')
          null

    const optionList = this.state.positionData.map(position => {
      return (
        <Select.Option value={position.title} key={position.key}>
          {`${position.title}: ${position.keyword}`}
          {/* {`${position.title}    키워드 : ${position.keyword}`} */}
        </Select.Option>
      )
    })

    let smsName
    // let signupRule
    let positionRule
    let smsContent = ''
    let recipientPlaceholder
    if (selectedRows.length === 0) {
      smsName = ''
      // signupRule = [{ required: false }]
      positionRule = [{ required: false }]
      recipientPlaceholder = '한 명만 보낼 수 있습니다. 폰 번호를 입력해주세요.'
    } else {
      smsName = receivers || selectedRows[0].name
      // signupRule = [{ required: true, message: 'Please fill in the sign.' }]
      positionRule = [
        { required: true, message: 'Please fill in the content.' }
      ]
      smsContent = `안녕하세요, 어제 제안드렸던 ${position} 에 대해서 어떻게 생각해보셨는지 문의차 다시 문자 드립니다. 간략히 검토후 의향에 대해서 회신 주시면 감사하겠습니다.`
      recipientPlaceholder = ''
    }

    return (
      <Form onSubmit={this.handleSubmit}>
        <Form.Item
          label="Recipient: " // Recipient
          {...formItemLayout}
        >
          {getFieldDecorator('receiver', {
            initialValue: smsName
            // initialValue: receivers || selectedRows[0].name
          })(<Input placeholder={recipientPlaceholder} />)}
        </Form.Item>

        {/* <Form.Item label="Position: " {...formItemLayout}>
          {getFieldDecorator('position', {
            initialValue: `포지션`
          })(<Input />)}
        </Form.Item> */}

        {selectedRows.length !== 0 ? (
          <Form.Item label="Positions: " {...formItemLayout} hasFeedback>
            {getFieldDecorator('select', {
              rules: positionRule
            })(
              <Select
                // value={position}
                showSearch
                style={{ width: '90 %' }}
                optionFilterProp="children"
                onChange={this.handlePositionChange}
                filterOption={(input, option) =>
                  option.props.children
                    .toLowerCase()
                    .indexOf(input.toLowerCase()) >= 0
                }
              >
                {optionList}
              </Select>
            )}
          </Form.Item>
        ) : null}
        <Form.Item {...formItemLayout} label="Content">
          {getFieldDecorator('content', {
            initialValue: smsContent,
            rules: [{ required: true, message: 'Please fill in the content.' }]
          })(<Input.TextArea rows={4} onChange={this.contentLength} />)}
        </Form.Item>
        {/* <span>{this.state.contentLength}/90</span> */}
        <span style={{ float: 'right' }}>
          {this.state.contentLength
            ? this.state.contentLength
            : smsContent.length}
          /90
        </span>

        {/* <Form.Item {...formItemLayout} label="Sign">
          {getFieldDecorator('sign', {
            rules: signupRule
            // rules: [{ required: true, message: 'Please fill in the sign.' }]
          })(<Input />)}
        </Form.Item> */}

        <Form.Item {...tailFormItemLayout}>
          <Button
            type="primary"
            htmlType="submit"
            disabled={selectedRows.length >= 1 && !!!position}
          >
            SEND
          </Button>
        </Form.Item>
      </Form>
    )
  }
}

const WrappedRegistrationForm = Form.create({ name: 'sms' })(SmsForm)

export default {
  SmsRegistration: WrappedRegistrationForm
}
