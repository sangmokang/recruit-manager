import React from 'react'
import { Link } from 'react-router-dom'
import { Menu, Icon } from 'antd'

export default class Test extends React.Component {
  state = {
    current: 'people'
  }

  handleClick = e => {
    this.setState({
      current: e.key
    })
  }

  logout = e => {
    this.props.logout()
  }

  render() {
    const { handleClick, logout, user_id } = this.props

    return (
      <Menu
        onClick={handleClick}
        selectedKeys={[this.state.current]}
        mode="horizontal"
      >
        <Menu.Item key="people" onClick={handleClick}>
          <Link to="/">
            <span>
              <Icon type="home" />
              <span>Recruit Manager</span>
            </span>
          </Link>
        </Menu.Item>
        <Menu.Item key="job" onClick={handleClick}>
          <Link to="/job">
            <span>Job</span>
          </Link>
        </Menu.Item>
        <Menu.Item key="mail" onClick={handleClick}>
          <Link to="/mail">
            <span>Mail</span>
          </Link>
        </Menu.Item>
        <Menu.Item key="SMS" onClick={handleClick}>
          <Link to="/sms">
            <span>SMS</span>
          </Link>
        </Menu.Item>
        <Menu.Item key="crawling" onClick={handleClick}>
          <Link to="/crawling">
            <span>Crawling</span>
          </Link>
        </Menu.Item>
        {user_id && (
          <Menu.Item key="logout" onClick={logout}>
            <span>Logout</span>
          </Menu.Item>
        )}
      </Menu>
    )
  }
}
