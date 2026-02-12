import React, { useState, useEffect, useCallback, FormEvent } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress,
  Card,
  CardContent,
  Tabs,
  Tab
} from '@mui/material'
import { styled } from '@mui/system'
import AddIcon from '@mui/icons-material/Add'
import GitHubIcon from '@mui/icons-material/GitHub'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { WalletClient, WalletInterface, StorageUploader, StorageUtils } from '@bsv/sdk'
import { createToken, queryTokens, HelloWorldToken } from 'hello-tokens'
import BabbageGo from '@babbage/go'

const Root = styled('div')({})
const AppBarSpacer = styled('div')({ height: '4em' })
const MessagesGrid = styled(Grid)({ padding: '1em' })
const LoadingBar = styled(LinearProgress)({ margin: '1em' })
const AddMoreFab = styled(Fab)({ position: 'fixed', right: '1em', bottom: '1em', zIndex: 10 })
const NoItems = styled(Grid)({ margin: 'auto', textAlign: 'center', marginTop: '5em' })

const wallet = new BabbageGo(new WalletClient())

const MessageCard = styled(Card)({
  margin: '0.5em',
  padding: '1em',
  minWidth: 200,
  maxWidth: 300,
  wordBreak: 'break-word'
})

const PAGE_LIMIT = 25
const DEFAULT_RETENTION_MINUTES = 60 * 24 * 7
const RETENTION_OPTIONS = [
  { label: '1 Hour', value: 60 },
  { label: '1 Day', value: 60 * 24 },
  { label: '7 Days', value: DEFAULT_RETENTION_MINUTES },
  { label: '30 Days', value: 60 * 24 * 30 }
]
const UHRP_STORAGE_URL = import.meta.env.VITE_UHRP_STORAGE_URL ?? 'https://nanostore.babbage.systems'

const HelloWorldApp: React.FC = () => {
  /* ------------------------------ Form state ------------------------------ */
  const [createOpen, setCreateOpen] = useState(false)
  const [createTab, setCreateTab] = useState<'text' | 'image'>('text')
  const [createMessage, setCreateMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [retentionMinutes, setRetentionMinutes] = useState<number>(DEFAULT_RETENTION_MINUTES)
  const [createLoading, setCreateLoading] = useState(false)

  /* --------------------------- Pagination state --------------------------- */
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  /* --------------------------- Messages state ---------------------------- */
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<HelloWorldToken[]>([])

  /* ----------------------------- Query state ----------------------------- */
  const [queryMessage, setQueryMessage] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const resetPagination = () => {
    setMessages([])
    setPage(0)
    setHasMore(true)
  }

  const buildQueryParams = () => {
    const params: Parameters<typeof queryTokens>[0] = {
      limit: PAGE_LIMIT,
      skip: page * PAGE_LIMIT,
      sortOrder
    }
    if (queryMessage.trim()) params.message = queryMessage.trim()
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    return params
  }

  const fetchMessages = useCallback(
    async (reset = false) => {
      if (!hasMore && !reset) return
      if (reset) resetPagination()
      setLoading(true)
      try {
        const tokens: HelloWorldToken[] = await queryTokens(buildQueryParams(), { wallet })

        setMessages(prev => (reset ? tokens : [...prev, ...tokens]))
        if (tokens.length < PAGE_LIMIT) setHasMore(false)
      } catch (err: any) {
        toast.error(`Failed to load messages: ${err.message}`)
        setHasMore(false)
      } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [page, sortOrder, queryMessage, startDate, endDate]
  )

  const closeCreateDialog = () => {
    setCreateOpen(false)
    setCreateTab('text')
    setCreateMessage('')
    setSelectedImage(null)
    setRetentionMinutes(DEFAULT_RETENTION_MINUTES)
  }

  const handleTextBroadcast = async (e: FormEvent) => {
    e.preventDefault()
    if (!createMessage.trim()) {
      toast.error('Enter a message to broadcast!')
      return
    }
    try {
      setCreateLoading(true)
      await createToken(createMessage.trim(), wallet)
      toast.success('Message broadcasted!')
      closeCreateDialog()
      /* Re-query from the beginning so the new token appears */
      fetchMessages(true)
    } catch (err: any) {
      toast.error(`Broadcast failed: ${err.message}`)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleImageBroadcast = async (e: FormEvent) => {
    e.preventDefault()
    if (!selectedImage) {
      toast.error('Choose an image to upload first.')
      return
    }

    try {
      setCreateLoading(true)
      debugger
      const uploader = new StorageUploader({ storageURL: UHRP_STORAGE_URL, wallet: wallet as WalletInterface })
      const imageBytes = new Uint8Array(await selectedImage.arrayBuffer())
      const uploadResult = await uploader.publishFile({
        file: {
          data: imageBytes,
          type: selectedImage.type || 'application/octet-stream'
        },
        retentionPeriod: retentionMinutes
      })

      const base58UhrpUrl = StorageUtils.normalizeURL(uploadResult.uhrpURL)
      await createToken(base58UhrpUrl, wallet)

      toast.success('Image uploaded and post broadcasted!')
      closeCreateDialog()
      fetchMessages(true)
    } catch (err: any) {
      toast.error(`Image broadcast failed: ${err.message}`)
    } finally {
      setCreateLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
    // Only on mount and when page or dependencies change
  }, [page, fetchMessages])

  return (
    <Root>
      {/* Notifications */}
      <ToastContainer position='top-right' autoClose={4000} pauseOnFocusLoss draggable pauseOnHover />

      {/* AppBar */}
      <AppBar position='static' sx={{ background: 'linear-gradient(45deg,#4446c7 30%,#00d1b2 90%)' }}>
        <Toolbar>
          <Typography variant='h6' sx={{ flexGrow: 1 }}>HelloWorld Postboard</Typography>
          <IconButton color='inherit' onClick={() => window.open('https://github.com/p2ppsr/overlay-demo-ui', '_blank')}>
            <GitHubIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <AppBarSpacer />

      {/* Search form */}
      <Grid container spacing={2} component='form' onSubmit={(e: { preventDefault: () => void }) => { e.preventDefault(); fetchMessages(true) }} sx={{ p: 2 }}>
        <Grid item xs={12} sm={4}>
          <TextField label='Search Message' fullWidth value={queryMessage} onChange={(e: { target: { value: React.SetStateAction<string> } }) => setQueryMessage(e.target.value)} />
        </Grid>
        <Grid item xs={6} sm={2}>
          <TextField type='date' label='Start Date' fullWidth InputLabelProps={{ shrink: true }} value={startDate} onChange={(e: { target: { value: React.SetStateAction<string> } }) => setStartDate(e.target.value)} />
        </Grid>
        <Grid item xs={6} sm={2}>
          <TextField type='date' label='End Date' fullWidth InputLabelProps={{ shrink: true }} value={endDate} onChange={(e: { target: { value: React.SetStateAction<string> } }) => setEndDate(e.target.value)} />
        </Grid>
        <Grid item xs={6} sm={2}>
          <FormControl fullWidth>
            <InputLabel id='sort-order-label'>Sort Order</InputLabel>
            <Select labelId='sort-order-label' label='Sort Order' value={sortOrder} onChange={(e: { target: { value: string } }) => setSortOrder(e.target.value as 'asc' | 'desc')}>
              <MenuItem value='desc'>Newest First</MenuItem>
              <MenuItem value='asc'>Oldest First</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6} sm={2} alignSelf='center'>
          <Button type='submit' variant='contained' fullWidth>Search</Button>
        </Grid>
      </Grid>

      {/* Messages */}
      <MessagesGrid container spacing={2} justifyContent='center'>
        {messages.map((m, idx) => (
          <Grid item key={idx}>
            <MessageCard>
              <CardContent>
                <Typography variant='body1'>{m.message}</Typography>
              </CardContent>
            </MessageCard>
          </Grid>
        ))}
      </MessagesGrid>

      {/* Empty state */}
      {messages.length === 0 && !loading && (
        <NoItems container direction='column' alignItems='center'>
          <Typography variant='h4'>No Messages</Typography>
          <Typography color='textSecondary'>Use the button below to broadcast a message</Typography>
          <Fab color='primary' sx={{ mt: 3 }} onClick={() => setCreateOpen(true)}><AddIcon /></Fab>
        </NoItems>
      )}

      {/* Pagination */}
      {loading && <LoadingBar />}
      {!loading && hasMore && (
        <Grid container justifyContent='center' sx={{ my: 2 }}>
          <Button variant='contained' onClick={() => setPage(p => p + 1)}>Load More</Button>
        </Grid>
      )}

      {/* Global FAB when list is non-empty */}
      {messages.length > 0 && <AddMoreFab color='primary' onClick={() => setCreateOpen(true)}><AddIcon /></AddMoreFab>}

      {/* Broadcast dialog */}
      <Dialog open={createOpen} onClose={closeCreateDialog} fullWidth maxWidth='sm'>
        <form onSubmit={createTab === 'text' ? handleTextBroadcast : handleImageBroadcast}>
          <DialogTitle>Broadcast a Message</DialogTitle>
          <DialogContent>
            <Tabs value={createTab} onChange={(_, tab) => setCreateTab(tab)} sx={{ mb: 2 }}>
              <Tab label='Text Post' value='text' />
              <Tab label='Image Upload' value='image' />
            </Tabs>
            {createTab === 'text' ? (
              <>
                <DialogContentText>Enter the message you wish to broadcast to the blockchain.</DialogContentText>
                <TextField
                  autoFocus multiline fullWidth rows={3} label='Message'
                  value={createMessage}
                  onChange={(e: { target: { value: React.SetStateAction<string> } }) => setCreateMessage(e.target.value)}
                  inputProps={{ maxLength: 280 }}
                  helperText={`${createMessage.length}/280`}
                />
              </>
            ) : (
              <>
                <DialogContentText sx={{ mb: 2 }}>
                  Upload an image to UHRP, then broadcast its base58 URL as the post content.
                </DialogContentText>
                <Button variant='outlined' component='label'>
                  Choose Image
                  <input
                    type='file'
                    hidden
                    accept='image/*'
                    onChange={(e) => setSelectedImage(e.target.files?.[0] ?? null)}
                  />
                </Button>
                <Typography variant='body2' sx={{ mt: 1, mb: 2 }}>
                  {selectedImage ? `Selected: ${selectedImage.name}` : 'No image selected'}
                </Typography>
                <FormControl fullWidth>
                  <InputLabel id='retention-minutes-label'>Retention Period</InputLabel>
                  <Select
                    labelId='retention-minutes-label'
                    label='Retention Period'
                    value={retentionMinutes}
                    onChange={(e) => setRetentionMinutes(Number(e.target.value))}
                  >
                    {RETENTION_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </>
            )}
          </DialogContent>
          {createLoading ? (
            <LoadingBar />
          ) : (
            <DialogActions>
              <Button onClick={closeCreateDialog}>Cancel</Button>
              <Button type='submit' variant='contained'>
                {createTab === 'text' ? 'Broadcast' : 'Upload & Broadcast'}
              </Button>
            </DialogActions>
          )}
        </form>
      </Dialog>
    </Root>
  )
}

export default HelloWorldApp;
