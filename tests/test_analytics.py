import pytest
import json
from unittest.mock import patch, MagicMock
from backend.services.analytics import publish_event
import backend.services.analytics as analytics_module

@patch("backend.services.analytics.CLOUD_ANALYTICS_ENABLED", True)
@patch("backend.services.analytics.STREAM_NAME", "test-stream")
@patch("backend.services.analytics._get_client")
def test_publish_event_success(mock_get_client):
    # Setup mock Firehose client
    mock_client = MagicMock()
    mock_get_client.return_value = mock_client

    payload = {"ip": "1.2.3.4", "status": "success"}
    
    publish_event("log", payload)
    
    # Verify put_record was called
    mock_client.put_record.assert_called_once()
    
    # Extract the args
    args, kwargs = mock_client.put_record.call_args
    assert kwargs["DeliveryStreamName"] == "test-stream"
    
    # Verify the JSON payload structure
    record_data = json.loads(kwargs["Record"]["Data"].decode("utf-8"))
    assert record_data["event_type"] == "log"
    assert record_data["payload"]["ip"] == "1.2.3.4"

@patch("backend.services.analytics.CLOUD_ANALYTICS_ENABLED", False)
@patch("backend.services.analytics._get_client")
def test_publish_event_disabled(mock_get_client):
    publish_event("log", {"test": True})
    mock_get_client.assert_not_called()

@patch("backend.services.analytics.CLOUD_ANALYTICS_ENABLED", True)
@patch("backend.services.analytics.STREAM_NAME", "test-stream")
@patch("backend.services.analytics._get_client")
@patch("backend.services.analytics.logger")
def test_publish_event_handles_exception(mock_logger, mock_get_client):
    # Setup mock Firehose client to raise exception
    mock_client = MagicMock()
    mock_client.put_record.side_effect = Exception("AWS Service Error")
    mock_get_client.return_value = mock_client

    # Should not raise exception
    publish_event("log", {"test": True})
    
    # Logger should be called with exception
    mock_logger.exception.assert_called_once()
