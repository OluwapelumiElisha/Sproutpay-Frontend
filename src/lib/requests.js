import SproutAxios from "@/lib/axios";
import axios from "axios";

export const GetRequest = async (url, config) => {
  try {
    const response = await SproutAxios.get(url, config);
    return response;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response) return e.response;
    throw e;
  }
};

export const PostRequest = async (url, data) => {
  try {
    const response = await SproutAxios.post(url, data);
    return response;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response) return e.response;
    throw e;
  }
};

export const PostRequestForm = async (url, data) => {
  try {
    const response = await SproutAxios.post(url, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response) return e.response;
    throw e;
  }
};

export const PatchRequest = async (url, data) => {
  try {
    const response = await SproutAxios.patch(url, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response) return e.response;
    throw e;
  }
};

export const DeleteRequest = async (url) => {
  try {
    const response = await SproutAxios.delete(url);
    return response;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response) return e.response;
    throw e;
  }
};